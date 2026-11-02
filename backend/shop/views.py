from decimal import Decimal
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Category, Product, CartItem, Order, OrderItem
from .serializers import (
    RegisterSerializer, CategorySerializer, ProductSerializer,
    CartItemSerializer, OrderSerializer,
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class CategoryList(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProductSerializer
    queryset = Product.objects.select_related("category").all()

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        search = params.get("search", "").strip()
        category = params.get("category", "").strip()
        min_price = params.get("min_price")
        max_price = params.get("max_price")
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))
        if category:
            qs = qs.filter(category__slug=category)
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        return qs

class CartList(generics.ListAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user).select_related("product", "product__category")

    def post(self, request):
        product_id = request.data.get("product_id")
        try:
            product = Product.objects.get(pk=product_id)
        except (Product.DoesNotExist, ValueError, TypeError):
            return Response({"detail": "Товар не найден"}, status=404)
        item, created = CartItem.objects.get_or_create(user=request.user, product=product)
        if not created:
            item.quantity += 1
            item.save(update_fields=["quantity"])
        return Response(CartItemSerializer(item).data, status=201)

class CartItemDetail(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    def get_object(self, request, pk):
        try:
            return CartItem.objects.get(pk=pk, user=request.user)
        except CartItem.DoesNotExist:
            return None
    def patch(self, request, pk):
        item = self.get_object(request, pk)
        if not item:
            return Response({"detail": "Позиция не найдена"}, status=404)
        try:
            quantity = int(request.data.get("quantity", item.quantity))
        except (ValueError, TypeError):
            return Response({"detail": "Некорректное количество"}, status=400)
        if quantity < 1:
            return Response({"detail": "Количество должно быть больше нуля"}, status=400)
        item.quantity = quantity
        item.save(update_fields=["quantity"])
        return Response(CartItemSerializer(item).data)
    def delete(self, request, pk):
        item = self.get_object(request, pk)
        if not item:
            return Response({"detail": "Позиция не найдена"}, status=404)
        item.delete()
        return Response(status=204)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):
    return Response({
        "id": request.user.id, "username": request.user.username,
        "email": request.user.email, "first_name": request.user.first_name,
        "last_name": request.user.last_name,
    })

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    for field in ("email", "first_name", "last_name"):
        if field in request.data:
            setattr(user, field, request.data[field])
    user.save()
    return profile(request)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_order(request):
    full_name = request.data.get("full_name", "").strip()
    phone = request.data.get("phone", "").strip()
    address = request.data.get("address", "").strip()
    if not all([full_name, phone, address]):
        return Response({"detail": "Заполните имя, телефон и адрес"}, status=400)
    items = list(CartItem.objects.filter(user=request.user).select_related("product"))
    if not items:
        return Response({"detail": "Корзина пуста"}, status=400)
    with transaction.atomic():
        for item in items:
            product = Product.objects.select_for_update().get(pk=item.product_id)
            if product.stock < item.quantity:
                return Response({"detail": f"Недостаточно товара: {product.name}"}, status=400)
        order = Order.objects.create(user=request.user, full_name=full_name, phone=phone, address=address)
        total = Decimal("0.00")
        for item in items:
            product = Product.objects.select_for_update().get(pk=item.product_id)
            OrderItem.objects.create(
                order=order, product_name=product.name, price=product.price, quantity=item.quantity
            )
            total += product.price * item.quantity
            product.stock -= item.quantity
            product.save(update_fields=["stock"])
        order.total = total
        order.save(update_fields=["total"])
        CartItem.objects.filter(user=request.user).delete()
    return Response(OrderSerializer(order).data, status=201)

class OrderList(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items")
