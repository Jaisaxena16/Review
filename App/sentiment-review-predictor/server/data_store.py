"""Dataset loader and in-memory store for clothing products and reviews."""
from __future__ import annotations

import csv
import math
import re
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "assignment3_II.csv"
_BASE_DATE = datetime(2024, 1, 1)


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "item"


@dataclass
class ProductRecord:
    """Internal representation of a clothing product."""

    id: str
    title: str
    description: str
    image_url: str
    clothing_ids: set[str] = field(default_factory=set)
    category_counter: Counter[str] = field(default_factory=Counter)
    department_counter: Counter[str] = field(default_factory=Counter)
    division_counter: Counter[str] = field(default_factory=Counter)
    review_count: int = 0
    rating_sum: float = 0.0
    rating_count: int = 0
    recommended_sum: int = 0
    positive_feedback_sum: int = 0
    search_blob: str = ""

    def to_public_dict(self) -> Dict[str, Any]:
        category = self._most_common(self.category_counter, default="General")
        department = self._most_common(self.department_counter, default="General")
        division = self._most_common(self.division_counter, default="General")

        average_rating = round(self.rating_sum / self.rating_count, 2) if self.rating_count else None
        recommendation_rate = (
            round(self.recommended_sum / self.review_count, 3) if self.review_count else None
        )

        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": category,
            "departmentName": department,
            "divisionName": division,
            "imageUrl": self.image_url,
            "averageRating": average_rating,
            "reviewCount": self.review_count,
            "positiveFeedbackCount": self.positive_feedback_sum,
            "recommendationRate": recommendation_rate,
            "clothingIds": sorted(self.clothing_ids),
        }

    @staticmethod
    def _most_common(counter: Counter[str], default: str) -> str:
        if not counter:
            return default
        return counter.most_common(1)[0][0]


class DataStore:
    """Loads the CSV dataset and exposes helper methods for queries."""

    def __init__(self, dataset_path: Path | None = None) -> None:
        self.dataset_path = dataset_path or DATA_PATH
        self.products: Dict[str, ProductRecord] = {}
        self.reviews_by_product: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.categories: List[str] = []
        self._load_dataset()

    def _load_dataset(self) -> None:
        if not self.dataset_path.exists():
            msg = f"Dataset not found at {self.dataset_path}"
            raise FileNotFoundError(msg)

        with self.dataset_path.open(newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            for index, row in enumerate(reader):
                title = (row.get("Clothes Title") or "Unknown Item").strip()
                description = (row.get("Clothes Description") or "").strip()
                slug = _slugify(title)
                product = self.products.get(slug)
                if not product:
                    product = ProductRecord(
                        id=slug,
                        title=title,
                        description=description,
                        image_url=self._build_image_url(slug, title),
                    )
                    self.products[slug] = product

                category = (row.get("Class Name") or "General").strip() or "General"
                department = (row.get("Department Name") or "General").strip() or "General"
                division = (row.get("Division Name") or "General").strip() or "General"
                clothing_id = (row.get("Clothing ID") or "").strip()

                product.category_counter[category] += 1
                product.department_counter[department] += 1
                product.division_counter[division] += 1
                if clothing_id:
                    product.clothing_ids.add(clothing_id)

                rating_value = self._safe_float(row.get("Rating"))
                if rating_value is not None:
                    product.rating_sum += rating_value
                    product.rating_count += 1

                recommended_value = self._safe_int(row.get("Recommended IND"))
                if recommended_value is not None:
                    product.recommended_sum += int(recommended_value)

                positive_feedback = self._safe_int(row.get("Positive Feedback Count")) or 0
                product.positive_feedback_sum += positive_feedback

                review_text = (row.get("Review Text") or "").strip()
                review_title = (row.get("Title") or "Untitled Review").strip() or "Untitled Review"
                age_value = self._safe_int(row.get("Age"))

                created_at = (_BASE_DATE - timedelta(days=index % 365)).isoformat()

                product.review_count += 1
                base_search_parts = [
                    product.search_blob,
                    product.title.lower(),
                    product.description.lower(),
                    category.lower(),
                    department.lower(),
                    division.lower(),
                    review_text.lower(),
                ]
                product.search_blob = " ".join(filter(None, base_search_parts))

                review_record = {
                    "id": f"csv-{index + 1}",
                    "title": review_title,
                    "reviewText": review_text,
                    "rating": rating_value,
                    "recommended": 1 if recommended_value == 1 else 0,
                    "age": age_value,
                    "positiveFeedbackCount": positive_feedback,
                    "clothingId": clothing_id,
                    "divisionName": division,
                    "departmentName": department,
                    "category": category,
                    "createdAt": created_at,
                }
                self.reviews_by_product[slug].append(review_record)

        self.categories = sorted({record._most_common(record.category_counter, "General") for record in self.products.values()})

    @staticmethod
    def _build_image_url(slug: str, title: str) -> str:
        keyword = slug or _slugify(title)
        return f"https://source.unsplash.com/featured/?clothing,{keyword}"

    @staticmethod
    def _safe_float(value: Optional[str]) -> Optional[float]:
        if value is None or value == "":
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _safe_int(value: Optional[str]) -> Optional[int]:
        if value is None or value == "":
            return None
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return None

    def _filter_products(
        self,
        search: Optional[str] = None,
        category: Optional[str] = None,
    ) -> Iterable[ProductRecord]:
        results: Iterable[ProductRecord] = self.products.values()
        if category:
            results = [p for p in results if p._most_common(p.category_counter, "General") == category]

        if search:
            normalized = search.lower().strip()
            if normalized:
                forms = {normalized}
                if normalized.endswith("s"):
                    forms.add(normalized[:-1])
                else:
                    forms.add(normalized + "s")
                results = [
                    p
                    for p in results
                    if any(form in p.search_blob for form in forms)
                ]
        return results

    def list_products(
        self,
        *,
        page: int = 1,
        page_size: int = 12,
        search: Optional[str] = None,
        category: Optional[str] = None,
    ) -> Dict[str, Any]:
        page = max(1, page)
        page_size = max(1, min(page_size, 100))

        filtered = list(self._filter_products(search=search, category=category))
        filtered.sort(key=lambda record: record.title.lower())
        total_items = len(filtered)
        total_pages = max(1, math.ceil(total_items / page_size)) if total_items else 1
        if total_items == 0:
            items: List[Dict[str, Any]] = []
        else:
            start = (page - 1) * page_size
            end = start + page_size
            items = [record.to_public_dict() for record in filtered[start:end]]

        return {
            "items": items,
            "page": page,
            "pageSize": page_size,
            "totalItems": total_items,
            "totalPages": total_pages,
            "availableCategories": self.categories,
        }

    def get_product(self, product_id: str) -> Dict[str, Any]:
        record = self.products.get(product_id)
        if not record:
            msg = f"Product '{product_id}' not found"
            raise KeyError(msg)

        product_payload = record.to_public_dict()
        product_payload["reviews"] = list(self.reviews_by_product.get(product_id, []))
        return product_payload

    def add_review(
        self,
        *,
        product_id: str,
        title: str,
        review_text: str,
        rating: float,
        recommended: int,
        age: Optional[int] = None,
    ) -> Dict[str, Any]:
        record = self.products.get(product_id)
        if not record:
            msg = f"Product '{product_id}' not found"
            raise KeyError(msg)

        recommended_value = 1 if recommended == 1 else 0
        created_at = datetime.utcnow().isoformat()
        review_id = f"user-{len(self.reviews_by_product[product_id]) + 1}"

        review_payload = {
            "id": review_id,
            "title": title.strip() or "Untitled Review",
            "reviewText": review_text.strip(),
            "rating": rating,
            "recommended": recommended_value,
            "age": age,
            "positiveFeedbackCount": 0,
            "clothingId": None,
            "divisionName": record._most_common(record.division_counter, "General"),
            "departmentName": record._most_common(record.department_counter, "General"),
            "category": record._most_common(record.category_counter, "General"),
            "createdAt": created_at,
        }

        self.reviews_by_product[product_id].insert(0, review_payload)

        record.review_count += 1
        if rating is not None:
            record.rating_sum += rating
            record.rating_count += 1
        record.recommended_sum += recommended_value
        record.search_blob = " ".join(
            filter(None, [record.search_blob, review_text.lower()])
        )

        return review_payload


def get_store() -> DataStore:
    """Return a singleton data store instance."""
    # Using a function attribute to memoize the store keeps import side-effects minimal.
    if not hasattr(get_store, "_instance"):
        setattr(get_store, "_instance", DataStore())
    return getattr(get_store, "_instance")
