from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import UserRegistrationSerializer, UserSerializer

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.exceptions import NotFound
from django.core.mail import send_mail



# Create your views here.


class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }, status=status.HTTP_201_CREATED)
        
        
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    
    if email and password:
        user = authenticate(request, username=email, password=password)
        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token)
            }, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        

@api_view(['GET'])
def profile_view(request):
    if request.user.is_authenticated:
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)
    
    # return Response(UserSerializer(request.user).data)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    if request.content_type and 'multipart/form-data' in request.content_type:
        # Handle file upload
        serializer = UserSerializer(user, data=request.data, partial=True)
    else:
        # Handle JSON data
        serializer = UserSerializer(user, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH'])
@permission_classes([AllowAny])
def update_password(request):
    user = request.user
    if not user.is_authenticated:
        return Response({"error": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
    
    new_password = request.data.get('new_password')
    if not new_password:
        return Response({"error": "New password is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    user.set_password(new_password)
    user.save()
    
    return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)

def generate_password(length=10):
    import random
    import string
    characters =  string.digits + string.punctuation + string.hexdigits
    password = ''.join(random.choice(characters) for i in range(length))
    return password

@api_view(['POST'])
@permission_classes([AllowAny]) 
def forgot_pass(request):
    email = request.data.get('email')
    if not email:
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    User = get_user_model()
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "User with this email does not exist"}, status=status.HTTP_404_NOT_FOUND)
    
    new_password = generate_password()
    user.set_password(new_password)
    user.save()
    
    send_mail(
        subject="Password Reset",
        message=f"Your new password is: {new_password}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
    )
    
    return Response({"message": "New password has been sent to your email"}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def all_user_emails(request):
    User = get_user_model()
    users = User.objects.all()
    emails = [user.email for user in users]
    return Response(emails, status=status.HTTP_200_OK)