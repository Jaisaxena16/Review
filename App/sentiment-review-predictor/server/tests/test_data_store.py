"""Comprehensive tests for the data_store module."""
from __future__ import annotations

import csv
import tempfile
from collections import Counter
from datetime import datetime
from pathlib import Path

import pytest

from server.data_store import (
    DATA_PATH,
    DataStore,
    ProductRecord,
    _slugify,
    get_store,
)


class TestSlugify:
    """Tests for the _slugify helper function."""

    def test_slugify_simple_text(self):
        """Test slugifying simple text."""
        assert _slugify("Hello World") == "hello-world"

    def test_slugify_with_special_characters(self):
        """Test slugifying text with special characters."""
        assert _slugify("A-Line Dress!") == "a-line-dress"
        assert _slugify("Top & Bottom") == "top-bottom"

    def test_slugify_multiple_spaces(self):
        """Test slugifying text with multiple spaces."""
        assert _slugify("Multiple   Spaces") == "multiple-spaces"

    def test_slugify_numbers(self):
        """Test slugifying text with numbers."""
        assert _slugify("Item 123") == "item-123"

    def test_slugify_empty_string(self):
        """Test slugifying empty string returns default."""
        assert _slugify("") == "item"

    def test_slugify_only_special_characters(self):
        """Test slugifying only special characters returns default."""
        assert _slugify("!!!@@@###") == "item"

    def test_slugify_leading_trailing_hyphens(self):
        """Test that leading/trailing hyphens are stripped."""
        assert _slugify("-hello-world-") == "hello-world"

    def test_slugify_unicode(self):
        """Test slugifying unicode characters."""
        result = _slugify("Café Dress")
        assert result == "caf-dress"


class TestProductRecord:
    """Tests for the ProductRecord dataclass."""

    def test_product_record_initialization(self):
        """Test creating a ProductRecord with required fields."""
        record = ProductRecord(
            id="test-item",
            title="Test Item",
            description="A test description",
            image_url="https://example.com/image.jpg",
        )
        assert record.id == "test-item"
        assert record.title == "Test Item"
        assert record.description == "A test description"
        assert record.image_url == "https://example.com/image.jpg"
        assert len(record.clothing_ids) == 0
        assert record.review_count == 0

    def test_product_record_to_public_dict_no_reviews(self):
        """Test converting ProductRecord to public dict with no reviews."""
        record = ProductRecord(
            id="test-item",
            title="Test Item",
            description="Test description",
            image_url="https://example.com/image.jpg",
        )
        public = record.to_public_dict()

        assert public["id"] == "test-item"
        assert public["title"] == "Test Item"
        assert public["description"] == "Test description"
        assert public["category"] == "General"
        assert public["departmentName"] == "General"
        assert public["divisionName"] == "General"
        assert public["averageRating"] is None
        assert public["reviewCount"] == 0
        assert public["recommendationRate"] is None

    def test_product_record_to_public_dict_with_reviews(self):
        """Test converting ProductRecord to public dict with reviews."""
        record = ProductRecord(
            id="test-item",
            title="Test Item",
            description="Test description",
            image_url="https://example.com/image.jpg",
        )
        record.category_counter["Dresses"] = 5
        record.department_counter["Women"] = 5
        record.division_counter["General"] = 5
        record.review_count = 5
        record.rating_sum = 22.5
        record.rating_count = 5
        record.recommended_sum = 4
        record.positive_feedback_sum = 10
        record.clothing_ids.add("1001")
        record.clothing_ids.add("1002")

        public = record.to_public_dict()

        assert public["category"] == "Dresses"
        assert public["departmentName"] == "Women"
        assert public["divisionName"] == "General"
        assert public["averageRating"] == 4.5
        assert public["reviewCount"] == 5
        assert public["recommendationRate"] == 0.8
        assert public["positiveFeedbackCount"] == 10
        assert public["clothingIds"] == ["1001", "1002"]

    def test_product_record_most_common_empty_counter(self):
        """Test _most_common with empty counter returns default."""
        result = ProductRecord._most_common(Counter(), "DefaultValue")
        assert result == "DefaultValue"

    def test_product_record_most_common_with_values(self):
        """Test _most_common returns the most common value."""
        counter = Counter({"A": 3, "B": 1, "C": 2})
        result = ProductRecord._most_common(counter, "Default")
        assert result == "A"

    def test_product_record_average_rating_calculation(self):
        """Test average rating is calculated correctly."""
        record = ProductRecord(
            id="test", title="Test", description="Desc", image_url="url"
        )
        record.rating_sum = 18.75
        record.rating_count = 5

        public = record.to_public_dict()
        assert public["averageRating"] == 3.75

    def test_product_record_recommendation_rate_calculation(self):
        """Test recommendation rate is calculated correctly."""
        record = ProductRecord(
            id="test", title="Test", description="Desc", image_url="url"
        )
        record.review_count = 10
        record.recommended_sum = 7

        public = record.to_public_dict()
        assert public["recommendationRate"] == 0.7


class TestDataStore:
    """Tests for the DataStore class."""

    @pytest.fixture
    def temp_csv(self):
        """Create a temporary CSV file for testing."""
        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".csv", newline="") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=[
                    "Clothing ID",
                    "Age",
                    "Title",
                    "Review Text",
                    "Rating",
                    "Recommended IND",
                    "Positive Feedback Count",
                    "Division Name",
                    "Department Name",
                    "Class Name",
                    "Clothes Title",
                    "Clothes Description",
                ],
            )
            writer.writeheader()
            writer.writerow({
                "Clothing ID": "1001",
                "Age": "25",
                "Title": "Great dress!",
                "Review Text": "Love this dress, fits perfectly.",
                "Rating": "5",
                "Recommended IND": "1",
                "Positive Feedback Count": "3",
                "Division Name": "General",
                "Department Name": "Dresses",
                "Class Name": "Dresses",
                "Clothes Title": "Elegant A-Line Dress",
                "Clothes Description": "A classic dress.",
            })
            writer.writerow({
                "Clothing ID": "1001",
                "Age": "30",
                "Title": "Good quality",
                "Review Text": "Nice fabric and comfortable.",
                "Rating": "4",
                "Recommended IND": "1",
                "Positive Feedback Count": "1",
                "Division Name": "General",
                "Department Name": "Dresses",
                "Class Name": "Dresses",
                "Clothes Title": "Elegant A-Line Dress",
                "Clothes Description": "A classic dress.",
            })
            writer.writerow({
                "Clothing ID": "2001",
                "Age": "28",
                "Title": "Comfortable top",
                "Review Text": "Very comfortable for everyday wear.",
                "Rating": "5",
                "Recommended IND": "1",
                "Positive Feedback Count": "2",
                "Division Name": "General",
                "Department Name": "Tops",
                "Class Name": "Tops",
                "Clothes Title": "Casual Cotton Top",
                "Clothes Description": "Soft cotton top.",
            })
            path = Path(f.name)

        yield path
        path.unlink()

    def test_datastore_initialization_missing_file(self):
        """Test DataStore raises error when CSV file is missing."""
        with pytest.raises(FileNotFoundError, match="Dataset not found"):
            DataStore(dataset_path=Path("/nonexistent/file.csv"))

    def test_datastore_loads_csv_correctly(self, temp_csv):
        """Test DataStore loads CSV data correctly."""
        store = DataStore(dataset_path=temp_csv)

        assert len(store.products) == 2
        assert "elegant-a-line-dress" in store.products
        assert "casual-cotton-top" in store.products

    def test_datastore_aggregates_reviews_per_product(self, temp_csv):
        """Test that reviews are correctly aggregated per product."""
        store = DataStore(dataset_path=temp_csv)

        dress_product = store.products["elegant-a-line-dress"]
        assert dress_product.review_count == 2
        assert len(store.reviews_by_product["elegant-a-line-dress"]) == 2

    def test_datastore_calculates_ratings_correctly(self, temp_csv):
        """Test rating calculations."""
        store = DataStore(dataset_path=temp_csv)

        dress_product = store.products["elegant-a-line-dress"]
        assert dress_product.rating_sum == 9.0
        assert dress_product.rating_count == 2

        public = dress_product.to_public_dict()
        assert public["averageRating"] == 4.5

    def test_datastore_safe_float_valid(self):
        """Test _safe_float with valid values."""
        assert DataStore._safe_float("3.5") == 3.5
        assert DataStore._safe_float("5") == 5.0

    def test_datastore_safe_float_invalid(self):
        """Test _safe_float with invalid values."""
        assert DataStore._safe_float(None) is None
        assert DataStore._safe_float("") is None
        assert DataStore._safe_float("invalid") is None

    def test_datastore_safe_int_valid(self):
        """Test _safe_int with valid values."""
        assert DataStore._safe_int("25") == 25
        assert DataStore._safe_int("30.5") == 30

    def test_datastore_safe_int_invalid(self):
        """Test _safe_int with invalid values."""
        assert DataStore._safe_int(None) is None
        assert DataStore._safe_int("") is None
        assert DataStore._safe_int("invalid") is None

    def test_datastore_build_image_url(self):
        """Test image URL building."""
        url = DataStore._build_image_url("test-item", "Test Item")
        assert "test-item" in url
        assert "clothing" in url

    def test_list_products_no_filters(self, temp_csv):
        """Test listing products without filters."""
        store = DataStore(dataset_path=temp_csv)
        result = store.list_products()

        assert result["totalItems"] == 2
        assert result["page"] == 1
        assert result["totalPages"] == 1
        assert len(result["items"]) == 2

    def test_list_products_with_pagination(self, temp_csv):
        """Test listing products with pagination."""
        store = DataStore(dataset_path=temp_csv)
        result = store.list_products(page=1, page_size=1)

        assert result["totalItems"] == 2
        assert result["totalPages"] == 2
        assert len(result["items"]) == 1

    def test_list_products_with_search(self, temp_csv):
        """Test listing products with search query."""
        store = DataStore(dataset_path=temp_csv)
        result = store.list_products(search="dress")

        assert result["totalItems"] == 1
        assert result["items"][0]["title"] == "Elegant A-Line Dress"

    def test_list_products_search_plural_singular(self, temp_csv):
        """Test search handles plural/singular forms."""
        store = DataStore(dataset_path=temp_csv)

        # Search singular when data has plural
        result = store.list_products(search="dress")
        assert result["totalItems"] >= 1

    def test_list_products_with_category_filter(self, temp_csv):
        """Test listing products filtered by category."""
        store = DataStore(dataset_path=temp_csv)
        result = store.list_products(category="Dresses")

        assert result["totalItems"] == 1
        assert result["items"][0]["category"] == "Dresses"

    def test_list_products_empty_results(self, temp_csv):
        """Test listing products with no matches."""
        store = DataStore(dataset_path=temp_csv)
        result = store.list_products(search="nonexistent")

        assert result["totalItems"] == 0
        assert len(result["items"]) == 0
        assert result["totalPages"] == 1

    def test_list_products_page_size_limits(self, temp_csv):
        """Test page size is clamped to valid range."""
        store = DataStore(dataset_path=temp_csv)

        # Test minimum
        result = store.list_products(page_size=0)
        assert result["pageSize"] >= 1

        # Test maximum
        result = store.list_products(page_size=200)
        assert result["pageSize"] <= 100

    def test_get_product_success(self, temp_csv):
        """Test retrieving a product by ID."""
        store = DataStore(dataset_path=temp_csv)
        product = store.get_product("elegant-a-line-dress")

        assert product["id"] == "elegant-a-line-dress"
        assert product["title"] == "Elegant A-Line Dress"
        assert "reviews" in product
        assert len(product["reviews"]) == 2

    def test_get_product_not_found(self, temp_csv):
        """Test retrieving a non-existent product raises KeyError."""
        store = DataStore(dataset_path=temp_csv)

        with pytest.raises(KeyError, match="not found"):
            store.get_product("nonexistent-product")

    def test_add_review_success(self, temp_csv):
        """Test adding a new review to a product."""
        store = DataStore(dataset_path=temp_csv)

        initial_count = store.products["elegant-a-line-dress"].review_count

        review = store.add_review(
            product_id="elegant-a-line-dress",
            title="New Review",
            review_text="This is a test review.",
            rating=4.0,
            recommended=1,
            age=32,
        )

        assert review["title"] == "New Review"
        assert review["reviewText"] == "This is a test review."
        assert review["rating"] == 4.0
        assert review["recommended"] == 1
        assert review["age"] == 32
        assert "id" in review
        assert "createdAt" in review

        # Verify product was updated
        product = store.products["elegant-a-line-dress"]
        assert product.review_count == initial_count + 1

    def test_add_review_updates_aggregates(self, temp_csv):
        """Test that adding a review updates product aggregates."""
        store = DataStore(dataset_path=temp_csv)

        initial_rating_sum = store.products["elegant-a-line-dress"].rating_sum
        initial_recommended = store.products["elegant-a-line-dress"].recommended_sum

        store.add_review(
            product_id="elegant-a-line-dress",
            title="Test",
            review_text="Test review",
            rating=5.0,
            recommended=1,
        )

        product = store.products["elegant-a-line-dress"]
        assert product.rating_sum == initial_rating_sum + 5.0
        assert product.recommended_sum == initial_recommended + 1

    def test_add_review_not_recommended(self, temp_csv):
        """Test adding a review with recommended=0."""
        store = DataStore(dataset_path=temp_csv)

        review = store.add_review(
            product_id="elegant-a-line-dress",
            title="Not great",
            review_text="Disappointed with quality.",
            rating=2.0,
            recommended=0,
        )

        assert review["recommended"] == 0

    def test_add_review_normalizes_recommended(self, temp_csv):
        """Test that recommended value is normalized to 0 or 1."""
        store = DataStore(dataset_path=temp_csv)

        review = store.add_review(
            product_id="elegant-a-line-dress",
            title="Test",
            review_text="Test",
            rating=3.0,
            recommended=5,  # Should be normalized to 0
        )

        assert review["recommended"] == 0

    def test_add_review_without_age(self, temp_csv):
        """Test adding a review without age."""
        store = DataStore(dataset_path=temp_csv)

        review = store.add_review(
            product_id="elegant-a-line-dress",
            title="Test",
            review_text="Test review",
            rating=4.0,
            recommended=1,
            age=None,
        )

        assert review["age"] is None

    def test_add_review_product_not_found(self, temp_csv):
        """Test adding a review to non-existent product raises KeyError."""
        store = DataStore(dataset_path=temp_csv)

        with pytest.raises(KeyError, match="not found"):
            store.add_review(
                product_id="nonexistent",
                title="Test",
                review_text="Test",
                rating=5.0,
                recommended=1,
            )

    def test_add_review_prepends_to_list(self, temp_csv):
        """Test that new reviews are added to the beginning of the list."""
        store = DataStore(dataset_path=temp_csv)

        store.add_review(
            product_id="elegant-a-line-dress",
            title="Newest Review",
            review_text="Most recent",
            rating=5.0,
            recommended=1,
        )

        reviews = store.reviews_by_product["elegant-a-line-dress"]
        assert reviews[0]["title"] == "Newest Review"

    def test_add_review_updates_search_blob(self, temp_csv):
        """Test that adding a review updates the search blob."""
        store = DataStore(dataset_path=temp_csv)

        store.add_review(
            product_id="elegant-a-line-dress",
            title="Test",
            review_text="unique searchable keyword",
            rating=5.0,
            recommended=1,
        )

        updated_blob = store.products["elegant-a-line-dress"].search_blob
        assert "unique searchable keyword" in updated_blob.lower()

    def test_categories_list_populated(self, temp_csv):
        """Test that categories list is populated correctly."""
        store = DataStore(dataset_path=temp_csv)

        assert len(store.categories) > 0
        assert "Dresses" in store.categories
        assert "Tops" in store.categories

    def test_filter_products_by_category(self, temp_csv):
        """Test filtering products by category."""
        store = DataStore(dataset_path=temp_csv)

        filtered = list(store._filter_products(category="Dresses"))
        assert len(filtered) == 1
        assert filtered[0].id == "elegant-a-line-dress"

    def test_filter_products_by_search(self, temp_csv):
        """Test filtering products by search term."""
        store = DataStore(dataset_path=temp_csv)

        filtered = list(store._filter_products(search="cotton"))
        assert len(filtered) == 1
        assert filtered[0].id == "casual-cotton-top"

    def test_filter_products_combined(self, temp_csv):
        """Test filtering products with multiple filters."""
        store = DataStore(dataset_path=temp_csv)

        # Search for "dress" in "Dresses" category
        filtered = list(store._filter_products(search="dress", category="Dresses"))
        assert len(filtered) == 1


class TestGetStore:
    """Tests for the get_store singleton function."""

    def test_get_store_returns_instance(self):
        """Test that get_store returns a DataStore instance."""
        store = get_store()
        assert isinstance(store, DataStore)

    def test_get_store_singleton_behavior(self):
        """Test that get_store returns the same instance."""
        store1 = get_store()
        store2 = get_store()
        assert store1 is store2


class TestEdgeCases:
    """Tests for edge cases and error conditions."""

    @pytest.fixture
    def minimal_csv(self):
        """Create a minimal CSV with edge case data."""
        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".csv", newline="") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=[
                    "Clothing ID",
                    "Age",
                    "Title",
                    "Review Text",
                    "Rating",
                    "Recommended IND",
                    "Positive Feedback Count",
                    "Division Name",
                    "Department Name",
                    "Class Name",
                    "Clothes Title",
                    "Clothes Description",
                ],
            )
            writer.writeheader()
            # Row with missing/empty values
            writer.writerow({
                "Clothing ID": "",
                "Age": "",
                "Title": "",
                "Review Text": "",
                "Rating": "",
                "Recommended IND": "",
                "Positive Feedback Count": "",
                "Division Name": "",
                "Department Name": "",
                "Class Name": "",
                "Clothes Title": "",
                "Clothes Description": "",
            })
            path = Path(f.name)

        yield path
        path.unlink()

    def test_datastore_handles_empty_values(self, minimal_csv):
        """Test DataStore handles empty CSV values gracefully."""
        store = DataStore(dataset_path=minimal_csv)

        assert len(store.products) >= 1
        # Default values should be used
        for product in store.products.values():
            public = product.to_public_dict()
            assert public["category"] == "General"
            assert public["departmentName"] == "General"

    def test_list_products_negative_page(self, minimal_csv):
        """Test list_products handles negative page numbers."""
        store = DataStore(dataset_path=minimal_csv)
        result = store.list_products(page=-1)

        # Should clamp to minimum page 1
        assert result["page"] == 1

    def test_review_with_empty_title(self, minimal_csv):
        """Test adding review with empty title uses default."""
        store = DataStore(dataset_path=minimal_csv)
        products = list(store.products.keys())
        if products:
            review = store.add_review(
                product_id=products[0],
                title="",
                review_text="Test",
                rating=5.0,
                recommended=1,
            )
            assert review["title"] == "Untitled Review"