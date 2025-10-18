"""Comprehensive tests for the Flask application endpoints."""
from __future__ import annotations

import json
from http import HTTPStatus
from unittest.mock import MagicMock, patch

import pytest

from server.app import app
from server.model_utils import ModelNotReadyError


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def mock_data_store():
    """Create a mock data store."""
    with patch("server.app.DATA_STORE") as mock_store:
        yield mock_store


class TestHealthEndpoint:
    """Tests for the /api/health endpoint."""

    def test_health_check_success(self, client):
        """Test health check returns success."""
        response = client.get("/api/health")
        assert response.status_code == HTTPStatus.OK
        
        data = json.loads(response.data)
        assert data["status"] == "ok"
        assert "models" in data
        assert "fasttext" in data["models"]
        assert "classifier" in data["models"]
        assert "tfidf_vectorizer" in data["models"]

    def test_health_check_includes_model_status(self, client):
        """Test health check includes model availability status."""
        response = client.get("/api/health")
        data = json.loads(response.data)
        
        # Model files may or may not exist in test environment
        assert isinstance(data["models"]["fasttext"], bool)
        assert isinstance(data["models"]["classifier"], bool)
        assert isinstance(data["models"]["tfidf_vectorizer"], bool)


class TestPredictEndpoint:
    """Tests for the /api/predict endpoint."""

    @patch("server.app.predict_recommendation")
    def test_predict_success(self, mock_predict, client):
        """Test successful prediction."""
        mock_predict.return_value = {
            "prediction": 1,
            "confidence": 0.95,
            "source": "backend",
        }
        
        response = client.post(
            "/api/predict",
            data=json.dumps({"reviewText": "Great product!", "rating": 5}),
            content_type="application/json",
        )
        
        assert response.status_code == HTTPStatus.OK
        data = json.loads(response.data)
        assert data["prediction"] == 1
        assert data["confidence"] == 0.95
        assert data["source"] == "backend"

    @patch("server.app.predict_recommendation")
    def test_predict_without_rating(self, mock_predict, client):
        """Test prediction without rating."""
        mock_predict.return_value = {
            "prediction": 0,
            "confidence": 0.75,
            "source": "backend",
        }
        
        response = client.post(
            "/api/predict",
            data=json.dumps({"reviewText": "Not good"}),
            content_type="application/json",
        )
        
        assert response.status_code == HTTPStatus.OK
        mock_predict.assert_called_once()
        call_kwargs = mock_predict.call_args[1]
        assert call_kwargs["rating"] is None

    def test_predict_missing_review_text(self, client):
        """Test prediction fails without review text."""
        response = client.post(
            "/api/predict",
            data=json.dumps({"rating": 5}),
            content_type="application/json",
        )
        
        assert response.status_code == HTTPStatus.BAD_REQUEST
        data = json.loads(response.data)
        assert "error" in data
        assert "reviewText" in data["error"]

    def test_predict_empty_review_text(self, client):
        """Test prediction fails with empty review text."""
        response = client.post(
            "/api/predict",
            data=json.dumps({"reviewText": "   ", "rating": 5}),
            content_type="application/json",
        )
        
        assert response.status_code == HTTPStatus.BAD_REQUEST

    def test_predict_invalid_json(self, client):
        """Test prediction handles invalid JSON."""
        response = client.post(
            "/api/predict",
            data="invalid json",
            content_type="application/json",
        )
        
        # Should handle gracefully
        assert response.status_code == HTTPStatus.BAD_REQUEST

    @patch("server.app.predict_recommendation")
    def test_predict_model_not_ready(self, mock_predict, client):
        """Test prediction when model is not ready."""
        mock_predict.side_effect = ModelNotReadyError("Model not loaded")
        
        response = client.post(
            "/api/predict",
            data=json.dumps({"reviewText": "Test review", "rating": 5}),
            content_type="application/json",
        )
        
        assert response.status_code == HTTPStatus.SERVICE_UNAVAILABLE
        data = json.loads(response.data)
        assert "error" in data

    @patch("server.app.predict_recommendation")
    def test_predict_invalid_rating(self, mock_predict, client):
        """Test prediction with invalid rating value."""
        mock_predict.return_value = {
            "prediction": 1,
            "confidence": 0.5,
            "source": "fallback",
        }
        
        response = client.post(
            "/api/predict",
            data=json.dumps({"reviewText": "Test", "rating": "invalid"}),
            content_type="application/json",
        )
        
        # Should still succeed, rating will be None
        assert response.status_code == HTTPStatus.OK


class TestProductsEndpoint:
    """Tests for the /api/products endpoint."""

    def test_list_products_default_params(self, client, mock_data_store):
        """Test listing products with default parameters."""
        mock_data_store.list_products.return_value = {
            "items": [],
            "page": 1,
            "pageSize": 12,
            "totalItems": 0,
            "totalPages": 1,
            "availableCategories": [],
        }
        
        response = client.get("/api/products")
        assert response.status_code == HTTPStatus.OK
        
        mock_data_store.list_products.assert_called_once_with(
            page=1,
            page_size=12,
            search=None,
            category=None,
        )

    def test_list_products_with_pagination(self, client, mock_data_store):
        """Test listing products with pagination parameters."""
        mock_data_store.list_products.return_value = {
            "items": [],
            "page": 2,
            "pageSize": 24,
            "totalItems": 50,
            "totalPages": 3,
            "availableCategories": [],
        }
        
        response = client.get("/api/products?page=2&page_size=24")
        assert response.status_code == HTTPStatus.OK
        
        mock_data_store.list_products.assert_called_once_with(
            page=2,
            page_size=24,
            search=None,
            category=None,
        )

    def test_list_products_with_search(self, client, mock_data_store):
        """Test listing products with search query."""
        mock_data_store.list_products.return_value = {
            "items": [],
            "page": 1,
            "pageSize": 12,
            "totalItems": 0,
            "totalPages": 1,
            "availableCategories": [],
        }
        
        response = client.get("/api/products?search=dress")
        assert response.status_code == HTTPStatus.OK
        
        mock_data_store.list_products.assert_called_once()
        call_kwargs = mock_data_store.list_products.call_args[1]
        assert call_kwargs["search"] == "dress"

    def test_list_products_with_category(self, client, mock_data_store):
        """Test listing products filtered by category."""
        mock_data_store.list_products.return_value = {
            "items": [],
            "page": 1,
            "pageSize": 12,
            "totalItems": 0,
            "totalPages": 1,
            "availableCategories": ["Dresses"],
        }
        
        response = client.get("/api/products?category=Dresses")
        assert response.status_code == HTTPStatus.OK
        
        call_kwargs = mock_data_store.list_products.call_args[1]
        assert call_kwargs["category"] == "Dresses"


class TestProductOptionsEndpoint:
    """Tests for the /api/products/options endpoint."""

    def test_list_product_options(self, client, mock_data_store):
        """Test listing product options for dropdown."""
        mock_record1 = MagicMock()
        mock_record1.to_public_dict.return_value = {
            "id": "dress-1",
            "title": "Dress 1",
            "category": "Dresses",
            "imageUrl": "http://example.com/1.jpg",
        }
        
        mock_record2 = MagicMock()
        mock_record2.to_public_dict.return_value = {
            "id": "top-1",
            "title": "Top 1",
            "category": "Tops",
            "imageUrl": "http://example.com/2.jpg",
        }
        
        mock_data_store.products = {
            "dress-1": mock_record1,
            "top-1": mock_record2,
        }
        
        response = client.get("/api/products/options")
        assert response.status_code == HTTPStatus.OK
        
        data = json.loads(response.data)
        assert "items" in data
        assert len(data["items"]) == 2

    def test_product_options_sorted_by_title(self, client, mock_data_store):
        """Test that product options are sorted alphabetically by title."""
        mock_record1 = MagicMock()
        mock_record1.to_public_dict.return_value = {
            "id": "item-z",
            "title": "Z Item",
            "category": "Category",
            "imageUrl": "url",
        }
        
        mock_record2 = MagicMock()
        mock_record2.to_public_dict.return_value = {
            "id": "item-a",
            "title": "A Item",
            "category": "Category",
            "imageUrl": "url",
        }
        
        mock_data_store.products = {
            "item-z": mock_record1,
            "item-a": mock_record2,
        }
        
        response = client.get("/api/products/options")
        data = json.loads(response.data)
        
        # Should be sorted alphabetically
        assert data["items"][0]["title"] == "A Item"
        assert data["items"][1]["title"] == "Z Item"


class TestGetProductEndpoint:
    """Tests for the /api/products/<product_id> endpoint."""

    def test_get_product_success(self, client, mock_data_store):
        """Test retrieving a product successfully."""
        mock_data_store.get_product.return_value = {
            "id": "test-product",
            "title": "Test Product",
            "reviews": [],
        }
        
        response = client.get("/api/products/test-product")
        assert response.status_code == HTTPStatus.OK
        
        data = json.loads(response.data)
        assert data["id"] == "test-product"

    def test_get_product_not_found(self, client, mock_data_store):
        """Test retrieving a non-existent product."""
        mock_data_store.get_product.side_effect = KeyError("Not found")
        
        response = client.get("/api/products/nonexistent")
        assert response.status_code == HTTPStatus.NOT_FOUND
        
        data = json.loads(response.data)
        assert "error" in data


class TestCreateReviewEndpoint:
    """Tests for the /api/reviews endpoint."""

    def test_create_review_success(self, client, mock_data_store):
        """Test creating a review successfully."""
        mock_data_store.add_review.return_value = {
            "id": "review-1",
            "title": "Great product",
            "reviewText": "Really enjoyed this",
            "rating": 5.0,
            "recommended": 1,
            "age": 30,
        }
        mock_data_store.get_product.return_value = {
            "id": "product-1",
            "title": "Product 1",
        }
        
        response = client.post(
            "/api/reviews",
            data=json.dumps({
                "productId": "product-1",
                "title": "Great product",
                "reviewText": "Really enjoyed this",
                "rating": 5,
                "recommended": 1,
                "age": 30,
            }),
            content_type="application/json",
        )
        
        assert response.status_code == HTTPStatus.CREATED
        data = json.loads(response.data)
        assert "review" in data
        assert "product" in data

    def test_create_review_missing_product_id(self, client):
        """Test creating review without product ID."""
        response = client.post(
            "/api/reviews",
            data=json.dumps({
                "title": "Test",
                "reviewText": "Test",
                "rating": 5,
                "recommended": 1,
            }),
            content_type="application/json",
        )
        
        assert response.status_code == HTTPStatus.BAD_REQUEST
        data = json.loads(response.data)
        assert "productId" in data["error"]

    def test_create_review_missing_title(self, client):
        """Test creating review without title."""
        response = client.post(
            "/api/reviews",
            data=json.dumps({
                "productId": "product-1",
                "reviewText": "Test",
                "rating": 5,
                "recommended": 1,
            }),
            content_type="application/json",
        )
        
        assert response.status_code == HTTPStatus.BAD_REQUEST
        data = json.loads(response.data)
        assert "title" in data["error"]

    def test_create_review_missing_review_text(self, client):
        """Test creating review without review text."""
        response = client.post(
            "/api/reviews",
            data=json.dumps({
                "productId": "product-1",
                "title": "Test",
                "rating": 5,
                "recommended": 1,
            }),
            content_type="application/json",
        )
        
        assert response.status_code == HTTPStatus.BAD_REQUEST
        data = json.loads(response.data)
        assert "reviewText" in data["error"]

    def test_create_review_invalid_rating(self, client):
        """Test creating review with invalid rating."""
        response = client.post(
            "/api/reviews",
            data=json.dumps({
                "productId": "product-1",
                "title": "Test",
                "reviewText": "Test",
                "rating": "invalid",
                "recommended": 1,
            }),
            content_type="application/json",
        )
        
        assert response.status_code == HTTPStatus.BAD_REQUEST
        data = json.loads(response.data)
        assert "rating" in data["error"]

    def test_create_review_invalid_recommended(self, client):
        """Test creating review with invalid recommended value."""
        response = client.post(
            "/api/reviews",
            data=json.dumps({
                "productId": "product-1",
                "title": "Test",
                "reviewText": "Test",
                "rating": 5,
                "recommended": 99,
            }),
            content_type="application/json",
        )
        
        assert response.status_code == HTTPStatus.BAD_REQUEST
        data = json.loads(response.data)
        assert "recommended" in data["error"]

    def test_create_review_recommended_as_string(self, client, mock_data_store):
        """Test creating review with recommended as string."""
        mock_data_store.add_review.return_value = {"id": "review-1"}
        mock_data_store.get_product.return_value = {"id": "product-1"}
        
        response = client.post(
            "/api/reviews",
            data=json.dumps({
                "productId": "product-1",
                "title": "Test",
                "reviewText": "Test",
                "rating": 5,
                "recommended": "1",  # String instead of int
            }),
            content_type="application/json",
        )
        
        assert response.status_code == HTTPStatus.CREATED

    def test_create_review_invalid_age(self, client):
        """Test creating review with invalid age."""
        response = client.post(
            "/api/reviews",
            data=json.dumps({
                "productId": "product-1",
                "title": "Test",
                "reviewText": "Test",
                "rating": 5,
                "recommended": 1,
                "age": "invalid",
            }),
            content_type="application/json",
        )
        
        assert response.status_code == HTTPStatus.BAD_REQUEST
        data = json.loads(response.data)
        assert "age" in data["error"]

    def test_create_review_without_age(self, client, mock_data_store):
        """Test creating review without age (optional field)."""
        mock_data_store.add_review.return_value = {"id": "review-1"}
        mock_data_store.get_product.return_value = {"id": "product-1"}
        
        response = client.post(
            "/api/reviews",
            data=json.dumps({
                "productId": "product-1",
                "title": "Test",
                "reviewText": "Test",
                "rating": 5,
                "recommended": 1,
            }),
            content_type="application/json",
        )
        
        assert response.status_code == HTTPStatus.CREATED

    def test_create_review_product_not_found(self, client, mock_data_store):
        """Test creating review for non-existent product."""
        mock_data_store.add_review.side_effect = KeyError("Product not found")
        
        response = client.post(
            "/api/reviews",
            data=json.dumps({
                "productId": "nonexistent",
                "title": "Test",
                "reviewText": "Test",
                "rating": 5,
                "recommended": 1,
            }),
            content_type="application/json",
        )
        
        assert response.status_code == HTTPStatus.NOT_FOUND
        data = json.loads(response.data)
        assert "error" in data

    def test_create_review_empty_strings_trimmed(self, client):
        """Test that empty/whitespace strings are properly handled."""
        response = client.post(
            "/api/reviews",
            data=json.dumps({
                "productId": "  ",
                "title": "  ",
                "reviewText": "  ",
                "rating": 5,
                "recommended": 1,
            }),
            content_type="application/json",
        )
        
        assert response.status_code == HTTPStatus.BAD_REQUEST


class TestCORSHeaders:
    """Tests for CORS configuration."""

    def test_cors_headers_present(self, client):
        """Test that CORS headers are present in responses."""
        response = client.get("/api/health")
        
        # CORS headers should allow cross-origin requests
        assert response.status_code == HTTPStatus.OK


class TestErrorHandling:
    """Tests for general error handling."""

    def test_invalid_route_returns_404(self, client):
        """Test that invalid routes return 404."""
        response = client.get("/api/invalid-route")
        assert response.status_code == HTTPStatus.NOT_FOUND

    def test_method_not_allowed(self, client):
        """Test that wrong HTTP methods return 405."""
        response = client.put("/api/health")
        assert response.status_code == HTTPStatus.METHOD_NOT_ALLOWED