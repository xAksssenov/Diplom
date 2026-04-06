from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from interactions.models import Complaint, Favorite, Review
from meal_plans.models import MealPlan, MealPlanItem, ShoppingList, ShoppingListItem
from moderation.models import ModerationLog, RecipeIngredientChangeNotice
from notifications.models import Notification
from recipes.models import Category, Ingredient, Recipe, RecipeIngredient, Tag
from users.models import Role, User


class Command(BaseCommand):
    help = "Populate database with demo data for local testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete previously seeded demo data before creating new data.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            self._reset_demo_data()

        roles = self._seed_roles()
        users = self._seed_users(roles)
        taxonomy = self._seed_taxonomy()
        recipes = self._seed_recipes(users, taxonomy)
        plans = self._seed_meal_plans(users, recipes)
        self._seed_reviews(users, recipes, plans)
        self._seed_complaints(users, recipes, plans)
        self._seed_favorites(users, recipes, plans)
        self._seed_notifications(users, recipes, plans)
        self._seed_moderation(users, recipes, plans)

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))
        self.stdout.write("Demo credentials:")
        self.stdout.write("  admin@foodplanner.local / Password123!")
        self.stdout.write("  moderator@foodplanner.local / Password123!")
        self.stdout.write("  alice@foodplanner.local / Password123!")
        self.stdout.write("  bob@foodplanner.local / Password123!")

    def _reset_demo_data(self):
        demo_domains = [
            "admin@foodplanner.local",
            "moderator@foodplanner.local",
            "alice@foodplanner.local",
            "bob@foodplanner.local",
        ]
        User.objects.filter(email__in=demo_domains).delete()
        Tag.objects.filter(name__startswith="demo-").delete()
        Category.objects.filter(name__startswith="Demo ").delete()
        Ingredient.objects.filter(name__startswith="Demo ").delete()
        Notification.objects.filter(message__icontains="[DEMO]").delete()

    def _seed_roles(self):
        role_user, _ = Role.objects.get_or_create(name=Role.RoleNames.USER)
        role_moderator, _ = Role.objects.get_or_create(name=Role.RoleNames.MODERATOR)
        role_admin, _ = Role.objects.get_or_create(name=Role.RoleNames.ADMIN)
        return {"user": role_user, "moderator": role_moderator, "admin": role_admin}

    def _seed_users(self, roles):
        admin, _ = User.objects.update_or_create(
            email="admin@foodplanner.local",
            defaults={
                "name": "Demo Admin",
                "role": roles["admin"],
                "is_staff": True,
                "is_superuser": True,
                "health_goals": "Управление платформой и контроль качества.",
            },
        )
        admin.set_password("Password123!")
        admin.save(update_fields=["password"])

        moderator, _ = User.objects.update_or_create(
            email="moderator@foodplanner.local",
            defaults={
                "name": "Demo Moderator",
                "role": roles["moderator"],
                "is_staff": True,
                "is_superuser": False,
                "health_goals": "Контроль модерации рецептов и отзывов.",
            },
        )
        moderator.set_password("Password123!")
        moderator.save(update_fields=["password"])

        alice, _ = User.objects.update_or_create(
            email="alice@foodplanner.local",
            defaults={
                "name": "Alice Green",
                "role": roles["user"],
                "is_staff": False,
                "is_superuser": False,
                "health_goals": "Снижение веса, больше белка, меньше сахара.",
            },
        )
        alice.set_password("Password123!")
        alice.save(update_fields=["password"])

        bob, _ = User.objects.update_or_create(
            email="bob@foodplanner.local",
            defaults={
                "name": "Bob Stone",
                "role": roles["user"],
                "is_staff": False,
                "is_superuser": False,
                "health_goals": "Набор мышечной массы, +300 ккал в день.",
            },
        )
        bob.set_password("Password123!")
        bob.save(update_fields=["password"])

        return {"admin": admin, "moderator": moderator, "alice": alice, "bob": bob}

    def _seed_taxonomy(self):
        breakfast, _ = Category.objects.update_or_create(
            name="Demo Завтраки",
            defaults={"description": "Быстрые варианты для утра."},
        )
        lunch, _ = Category.objects.update_or_create(
            name="Demo Обеды",
            defaults={"description": "Сбалансированные блюда на день."},
        )
        dinner, _ = Category.objects.update_or_create(
            name="Demo Ужины",
            defaults={"description": "Легкие блюда на вечер."},
        )

        oats, _ = Ingredient.objects.update_or_create(
            name="Demo Овсяные хлопья",
            defaults={
                "calories_per_100g": Decimal("367.00"),
                "protein_per_100g": Decimal("13.00"),
                "fat_per_100g": Decimal("6.50"),
                "carbs_per_100g": Decimal("60.00"),
                "unit": "g",
            },
        )
        egg, _ = Ingredient.objects.update_or_create(
            name="Demo Яйцо",
            defaults={
                "calories_per_100g": Decimal("157.00"),
                "protein_per_100g": Decimal("13.00"),
                "fat_per_100g": Decimal("11.00"),
                "carbs_per_100g": Decimal("1.10"),
                "unit": "g",
            },
        )
        chicken, _ = Ingredient.objects.update_or_create(
            name="Demo Куриная грудка",
            defaults={
                "calories_per_100g": Decimal("165.00"),
                "protein_per_100g": Decimal("31.00"),
                "fat_per_100g": Decimal("3.60"),
                "carbs_per_100g": Decimal("0.00"),
                "unit": "g",
            },
        )
        buckwheat, _ = Ingredient.objects.update_or_create(
            name="Demo Гречка",
            defaults={
                "calories_per_100g": Decimal("343.00"),
                "protein_per_100g": Decimal("13.00"),
                "fat_per_100g": Decimal("3.40"),
                "carbs_per_100g": Decimal("71.00"),
                "unit": "g",
            },
        )
        tomato, _ = Ingredient.objects.update_or_create(
            name="Demo Помидор",
            defaults={
                "calories_per_100g": Decimal("18.00"),
                "protein_per_100g": Decimal("0.90"),
                "fat_per_100g": Decimal("0.20"),
                "carbs_per_100g": Decimal("3.90"),
                "unit": "g",
            },
        )

        quick, _ = Tag.objects.get_or_create(name="demo-quick")
        high_protein, _ = Tag.objects.get_or_create(name="demo-high-protein")
        low_carb, _ = Tag.objects.get_or_create(name="demo-low-carb")

        return {
            "categories": {
                "breakfast": breakfast,
                "lunch": lunch,
                "dinner": dinner,
            },
            "ingredients": {
                "oats": oats,
                "egg": egg,
                "chicken": chicken,
                "buckwheat": buckwheat,
                "tomato": tomato,
            },
            "tags": {
                "quick": quick,
                "high_protein": high_protein,
                "low_carb": low_carb,
            },
        }

    def _seed_recipes(self, users, taxonomy):
        recipe1, _ = Recipe.objects.update_or_create(
            title="Demo Протеиновая овсянка",
            author=users["alice"],
            defaults={
                "category": taxonomy["categories"]["breakfast"],
                "description": "Плотный завтрак с акцентом на белок.",
                "cooking_time": 12,
                "difficulty": Recipe.Difficulty.EASY,
                "instructions": "Сварить овсянку, добавить яйцо в конце, перемешать до кремовой текстуры.",
                "nutrition_calories": Decimal("390.00"),
                "nutrition_protein": Decimal("22.00"),
                "nutrition_fat": Decimal("11.00"),
                "nutrition_carbs": Decimal("48.00"),
                "status": Recipe.ModerationStatus.APPROVED,
                "is_deleted": False,
            },
        )
        recipe1.tags.set([taxonomy["tags"]["quick"], taxonomy["tags"]["high_protein"]])
        RecipeIngredient.objects.update_or_create(
            recipe=recipe1,
            ingredient=taxonomy["ingredients"]["oats"],
            defaults={"quantity": Decimal("80.00"), "unit": "g"},
        )
        RecipeIngredient.objects.update_or_create(
            recipe=recipe1,
            ingredient=taxonomy["ingredients"]["egg"],
            defaults={"quantity": Decimal("60.00"), "unit": "g"},
        )

        recipe2, _ = Recipe.objects.update_or_create(
            title="Demo Курица с гречкой",
            author=users["bob"],
            defaults={
                "category": taxonomy["categories"]["lunch"],
                "description": "Классический обед для набора чистой массы.",
                "cooking_time": 35,
                "difficulty": Recipe.Difficulty.MEDIUM,
                "instructions": "Отварить гречку, курицу запечь до готовности, подать с томатами.",
                "nutrition_calories": Decimal("620.00"),
                "nutrition_protein": Decimal("52.00"),
                "nutrition_fat": Decimal("12.00"),
                "nutrition_carbs": Decimal("72.00"),
                "status": Recipe.ModerationStatus.APPROVED,
                "is_deleted": False,
            },
        )
        recipe2.tags.set([taxonomy["tags"]["high_protein"]])
        RecipeIngredient.objects.update_or_create(
            recipe=recipe2,
            ingredient=taxonomy["ingredients"]["chicken"],
            defaults={"quantity": Decimal("220.00"), "unit": "g"},
        )
        RecipeIngredient.objects.update_or_create(
            recipe=recipe2,
            ingredient=taxonomy["ingredients"]["buckwheat"],
            defaults={"quantity": Decimal("120.00"), "unit": "g"},
        )
        RecipeIngredient.objects.update_or_create(
            recipe=recipe2,
            ingredient=taxonomy["ingredients"]["tomato"],
            defaults={"quantity": Decimal("150.00"), "unit": "g"},
        )

        recipe3, _ = Recipe.objects.update_or_create(
            title="Demo Омлет без лишних углеводов",
            author=users["alice"],
            defaults={
                "category": taxonomy["categories"]["dinner"],
                "description": "Легкий ужин с низким содержанием углеводов.",
                "cooking_time": 15,
                "difficulty": Recipe.Difficulty.EASY,
                "instructions": "Взбить яйца, пожарить на среднем огне, подать с томатами.",
                "nutrition_calories": Decimal("280.00"),
                "nutrition_protein": Decimal("20.00"),
                "nutrition_fat": Decimal("19.00"),
                "nutrition_carbs": Decimal("4.00"),
                "status": Recipe.ModerationStatus.PENDING,
                "is_deleted": False,
            },
        )
        recipe3.tags.set([taxonomy["tags"]["quick"], taxonomy["tags"]["low_carb"]])
        RecipeIngredient.objects.update_or_create(
            recipe=recipe3,
            ingredient=taxonomy["ingredients"]["egg"],
            defaults={"quantity": Decimal("180.00"), "unit": "g"},
        )
        RecipeIngredient.objects.update_or_create(
            recipe=recipe3,
            ingredient=taxonomy["ingredients"]["tomato"],
            defaults={"quantity": Decimal("100.00"), "unit": "g"},
        )

        return {"oatmeal": recipe1, "chicken": recipe2, "omelet": recipe3}

    def _seed_meal_plans(self, users, recipes):
        today = date.today()

        plan1, _ = MealPlan.objects.update_or_create(
            user=users["alice"],
            plan_type=MealPlan.PlanType.PERSONAL,
            start_date=today,
            end_date=today + timedelta(days=6),
            defaults={
                "total_calories": Decimal("1800.00"),
                "status": MealPlan.Status.APPROVED,
                "is_deleted": False,
            },
        )
        MealPlanItem.objects.update_or_create(
            meal_plan=plan1,
            day_number=1,
            meal_type=MealPlanItem.MealType.BREAKFAST,
            recipe=recipes["oatmeal"],
            defaults={"servings": Decimal("1.00")},
        )
        MealPlanItem.objects.update_or_create(
            meal_plan=plan1,
            day_number=1,
            meal_type=MealPlanItem.MealType.DINNER,
            recipe=recipes["chicken"],
            defaults={"servings": Decimal("1.00")},
        )

        plan2, _ = MealPlan.objects.update_or_create(
            user=users["bob"],
            plan_type=MealPlan.PlanType.FITNESS,
            start_date=today + timedelta(days=1),
            end_date=today + timedelta(days=7),
            defaults={
                "total_calories": Decimal("2500.00"),
                "status": MealPlan.Status.PENDING,
                "is_deleted": False,
            },
        )
        MealPlanItem.objects.update_or_create(
            meal_plan=plan2,
            day_number=1,
            meal_type=MealPlanItem.MealType.LUNCH,
            recipe=recipes["chicken"],
            defaults={"servings": Decimal("1.50")},
        )
        MealPlanItem.objects.update_or_create(
            meal_plan=plan2,
            day_number=1,
            meal_type=MealPlanItem.MealType.DINNER,
            recipe=recipes["omelet"],
            defaults={"servings": Decimal("1.00")},
        )

        shopping_list, _ = ShoppingList.objects.update_or_create(
            user=users["alice"],
            status=ShoppingList.Status.ACTIVE,
            defaults={},
        )
        ShoppingListItem.objects.update_or_create(
            shopping_list=shopping_list,
            ingredient=recipes["oatmeal"].recipe_ingredients.first().ingredient,
            unit="g",
            defaults={"quantity": Decimal("300.00"), "is_purchased": False},
        )
        ShoppingListItem.objects.update_or_create(
            shopping_list=shopping_list,
            ingredient=recipes["chicken"].recipe_ingredients.first().ingredient,
            unit="g",
            defaults={"quantity": Decimal("500.00"), "is_purchased": True},
        )

        return {"alice_plan": plan1, "bob_plan": plan2}

    def _seed_reviews(self, users, recipes, plans):
        Review.objects.update_or_create(
            user=users["bob"],
            target_type=Review.TargetType.RECIPE,
            target_id=recipes["oatmeal"].id,
            defaults={
                "rating": 5,
                "comment": "Отличный завтрак, быстро и вкусно.",
                "is_approved": True,
                "is_deleted": False,
            },
        )
        Review.objects.update_or_create(
            user=users["alice"],
            target_type=Review.TargetType.MEAL_PLAN,
            target_id=plans["alice_plan"].id,
            defaults={
                "rating": 4,
                "comment": "План удобный, но хочу больше ужинов с рыбой.",
                "is_approved": True,
                "is_deleted": False,
            },
        )
        Review.objects.update_or_create(
            user=users["alice"],
            target_type=Review.TargetType.RECIPE,
            target_id=recipes["chicken"].id,
            defaults={
                "rating": 3,
                "comment": "Нормально, но суховато.",
                "is_approved": False,
                "is_deleted": False,
            },
        )

    def _seed_complaints(self, users, recipes, plans):
        Complaint.objects.update_or_create(
            user=users["alice"],
            target_type=Complaint.TargetType.RECIPE,
            target_id=recipes["omelet"].id,
            defaults={
                "reason": "Подозрение на некорректный расчет БЖУ.",
                "status": Complaint.Status.NEW,
                "response": "",
                "resolved_by": None,
            },
        )
        Complaint.objects.update_or_create(
            user=users["bob"],
            target_type=Complaint.TargetType.MEAL_PLAN,
            target_id=plans["bob_plan"].id,
            defaults={
                "reason": "План долго висит на модерации.",
                "status": Complaint.Status.RESOLVED,
                "response": "План проверен и будет опубликован после правок.",
                "resolved_by": users["moderator"],
            },
        )

    def _seed_favorites(self, users, recipes, plans):
        Favorite.objects.update_or_create(
            user=users["alice"],
            target_type=Favorite.TargetType.RECIPE,
            target_id=recipes["chicken"].id,
            defaults={},
        )
        Favorite.objects.update_or_create(
            user=users["alice"],
            target_type=Favorite.TargetType.MEAL_PLAN,
            target_id=plans["bob_plan"].id,
            defaults={},
        )
        Favorite.objects.update_or_create(
            user=users["bob"],
            target_type=Favorite.TargetType.RECIPE,
            target_id=recipes["oatmeal"].id,
            defaults={},
        )

    def _seed_notifications(self, users, recipes, plans):
        Notification.objects.update_or_create(
            user=users["alice"],
            event_type=Notification.EventType.RECIPE_MODERATION,
            message=f"[DEMO] Recipe #{recipes['omelet'].id} is pending moderation.",
            defaults={"is_read": False},
        )
        Notification.objects.update_or_create(
            user=users["bob"],
            event_type=Notification.EventType.PLAN_MODERATION,
            message=f"[DEMO] Meal plan #{plans['bob_plan'].id} status: pending.",
            defaults={"is_read": False},
        )
        Notification.objects.update_or_create(
            user=users["moderator"],
            event_type=Notification.EventType.NEW_COMPLAINT,
            message="[DEMO] New complaint requires review.",
            defaults={"is_read": False},
        )
        Notification.objects.update_or_create(
            user=users["alice"],
            event_type=Notification.EventType.COMPLAINT_RESPONSE,
            message="[DEMO] You received a response for your complaint.",
            defaults={"is_read": True},
        )

    def _seed_moderation(self, users, recipes, plans):
        ModerationLog.objects.update_or_create(
            moderator=users["moderator"],
            target_type=ModerationLog.TargetType.RECIPE,
            target_id=recipes["oatmeal"].id,
            decision=ModerationLog.Decision.APPROVED,
            defaults={"comment": "Рецепт корректен, публикуем."},
        )
        ModerationLog.objects.update_or_create(
            moderator=users["moderator"],
            target_type=ModerationLog.TargetType.MEAL_PLAN,
            target_id=plans["bob_plan"].id,
            decision=ModerationLog.Decision.UPDATED,
            defaults={"comment": "Уточнены калории и порции."},
        )
        RecipeIngredientChangeNotice.objects.update_or_create(
            recipe=recipes["omelet"],
            moderator=users["moderator"],
            defaults={
                "message": "Добавлено уточнение по количеству томатов после проверки.",
                "author_notified": True,
            },
        )
