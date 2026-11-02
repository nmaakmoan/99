from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, CategoryList, ProductViewSet, CartList, CartItemDetail,
    profile, update_profile, create_order, OrderList,
)

router = DefaultRouter()
router.register("products", ProductViewSet, basename="product")

urlpatterns = [
    path("auth/register/", RegisterView.as_view()),
    path("auth/token/", TokenObtainPairView.as_view()),
    path("auth/token/refresh/", TokenRefreshView.as_view()),
    path("categories/", CategoryList.as_view()),
    path("cart/", CartList.as_view()),
    path("cart/<int:pk>/", CartItemDetail.as_view()),
    path("profile/", profile),
    path("profile/update/", update_profile),
    path("orders/", OrderList.as_view()),
    path("orders/create/", create_order),
    path("", include(router.urls)),
]
