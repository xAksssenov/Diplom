from rest_framework.permissions import BasePermission, SAFE_METHODS


def get_role_name(user) -> str:
    if not user or not user.is_authenticated:
        return ""
    if user.is_superuser:
        return "admin"
    if user.role_id and user.role:
        return user.role.name
    return ""


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return get_role_name(request.user) == "admin"


class IsModeratorOrAdminRole(BasePermission):
    def has_permission(self, request, view):
        role_name = get_role_name(request.user)
        return role_name in {"moderator", "admin"}


class IsOwnerOrAdminOrReadOnly(BasePermission):
    owner_field = "user"

    def has_permission(self, request, view):
        return request.method in SAFE_METHODS or request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        role_name = get_role_name(request.user)
        if role_name == "admin":
            return True

        owner = getattr(obj, self.owner_field, None)
        return owner == request.user
