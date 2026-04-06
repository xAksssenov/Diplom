from datetime import date, timedelta
from decimal import Decimal
import random

from django.core.management.base import BaseCommand
from django.db import transaction

from interactions.models import Complaint, Favorite, Review
from meal_plans.models import MealPlan, MealPlanItem, ShoppingList, ShoppingListItem
from moderation.models import ModerationLog, RecipeIngredientChangeNotice
from notifications.models import Notification
from recipes.models import Category, Ingredient, Recipe, RecipeIngredient, Tag
from users.models import Role, User


class Command(BaseCommand):
    help = "Populate database with realistic showcase data for local testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete previously seeded demo data before creating new data.",
        )
        parser.add_argument(
            "--bulk-users",
            type=int,
            default=30,
            help="How many extra demo users to create.",
        )
        parser.add_argument(
            "--bulk-recipes",
            type=int,
            default=120,
            help="How many extra recipes to create.",
        )
        parser.add_argument(
            "--bulk-plans",
            type=int,
            default=80,
            help="How many extra meal plans to create.",
        )
        parser.add_argument(
            "--bulk-reviews",
            type=int,
            default=240,
            help="How many extra reviews to create.",
        )
        parser.add_argument(
            "--bulk-favorites",
            type=int,
            default=300,
            help="How many extra favorites to create.",
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
        self._seed_bulk_data(
            roles=roles,
            taxonomy=taxonomy,
            bulk_users=max(0, options["bulk_users"]),
            bulk_recipes=max(0, options["bulk_recipes"]),
            bulk_plans=max(0, options["bulk_plans"]),
            bulk_reviews=max(0, options["bulk_reviews"]),
            bulk_favorites=max(0, options["bulk_favorites"]),
        )

        self.stdout.write(self.style.SUCCESS("Showcase data seeded successfully."))
        self.stdout.write("Credentials:")
        self.stdout.write("  admin@foodplanner.local / Password123!")
        self.stdout.write("  moderator@foodplanner.local / Password123!")
        self.stdout.write("  alice@foodplanner.local / Password123!")
        self.stdout.write("  bob@foodplanner.local / Password123!")
        self.stdout.write("  bulk1@foodplanner.local / Password123!")

    def _reset_demo_data(self):
        demo_domains = [
            "admin@foodplanner.local",
            "moderator@foodplanner.local",
            "alice@foodplanner.local",
            "bob@foodplanner.local",
        ]
        User.objects.filter(email__in=demo_domains).delete()
        User.objects.filter(email__startswith="bulk", email__endswith="@foodplanner.local").delete()
        Tag.objects.filter(name__startswith="demo-").delete()
        Tag.objects.filter(
            name__in=[
                "Быстро",
                "Высокобелковое",
                "Низкоуглеводное",
                "Без глютена",
                "Без лактозы",
                "Завтрак",
                "Вегетарианское",
                "Сытное",
            ]
        ).delete()
        Category.objects.filter(name__startswith="Demo ").delete()
        Category.objects.filter(name__in=["Завтраки", "Обеды", "Ужины"]).delete()
        Ingredient.objects.filter(name__startswith="Demo ").delete()
        Ingredient.objects.filter(
            name__in=["Овсяные хлопья", "Яйцо", "Куриная грудка", "Гречка", "Помидор"]
        ).delete()
        Notification.objects.filter(user__email__endswith="@foodplanner.local").delete()

    def _seed_roles(self):
        role_user, _ = Role.objects.get_or_create(name=Role.RoleNames.USER)
        role_moderator, _ = Role.objects.get_or_create(name=Role.RoleNames.MODERATOR)
        role_admin, _ = Role.objects.get_or_create(name=Role.RoleNames.ADMIN)
        return {"user": role_user, "moderator": role_moderator, "admin": role_admin}

    def _seed_users(self, roles):
        admin, _ = User.objects.update_or_create(
            email="admin@foodplanner.local",
            defaults={
                "name": "Павел Воронов",
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
                "name": "Марина Крылова",
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
                "name": "Алиса Грин",
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
                "name": "Борис Стоун",
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
            name="Завтраки",
            defaults={"description": "Быстрые варианты для утра."},
        )
        lunch, _ = Category.objects.update_or_create(
            name="Обеды",
            defaults={"description": "Сбалансированные блюда на день."},
        )
        dinner, _ = Category.objects.update_or_create(
            name="Ужины",
            defaults={"description": "Легкие блюда на вечер."},
        )

        oats, _ = Ingredient.objects.update_or_create(
            name="Овсяные хлопья",
            defaults={
                "calories_per_100g": Decimal("367.00"),
                "protein_per_100g": Decimal("13.00"),
                "fat_per_100g": Decimal("6.50"),
                "carbs_per_100g": Decimal("60.00"),
                "unit": "g",
            },
        )
        egg, _ = Ingredient.objects.update_or_create(
            name="Яйцо",
            defaults={
                "calories_per_100g": Decimal("157.00"),
                "protein_per_100g": Decimal("13.00"),
                "fat_per_100g": Decimal("11.00"),
                "carbs_per_100g": Decimal("1.10"),
                "unit": "g",
            },
        )
        chicken, _ = Ingredient.objects.update_or_create(
            name="Куриная грудка",
            defaults={
                "calories_per_100g": Decimal("165.00"),
                "protein_per_100g": Decimal("31.00"),
                "fat_per_100g": Decimal("3.60"),
                "carbs_per_100g": Decimal("0.00"),
                "unit": "g",
            },
        )
        buckwheat, _ = Ingredient.objects.update_or_create(
            name="Гречка",
            defaults={
                "calories_per_100g": Decimal("343.00"),
                "protein_per_100g": Decimal("13.00"),
                "fat_per_100g": Decimal("3.40"),
                "carbs_per_100g": Decimal("71.00"),
                "unit": "g",
            },
        )
        tomato, _ = Ingredient.objects.update_or_create(
            name="Помидор",
            defaults={
                "calories_per_100g": Decimal("18.00"),
                "protein_per_100g": Decimal("0.90"),
                "fat_per_100g": Decimal("0.20"),
                "carbs_per_100g": Decimal("3.90"),
                "unit": "g",
            },
        )

        quick, _ = Tag.objects.get_or_create(name="Быстро")
        high_protein, _ = Tag.objects.get_or_create(name="Высокобелковое")
        low_carb, _ = Tag.objects.get_or_create(name="Низкоуглеводное")
        gluten_free, _ = Tag.objects.get_or_create(name="Без глютена")
        lactose_free, _ = Tag.objects.get_or_create(name="Без лактозы")
        breakfast_tag, _ = Tag.objects.get_or_create(name="Завтрак")
        fast_tag, _ = Tag.objects.get_or_create(name="Сытное")
        vegan_tag, _ = Tag.objects.get_or_create(name="Вегетарианское")
        high_protein_ru, _ = Tag.objects.get_or_create(name="Белковый акцент")

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
                "gluten_free": gluten_free,
                "lactose_free": lactose_free,
                "breakfast": breakfast_tag,
                "fast": fast_tag,
                "vegan": vegan_tag,
                "high_protein_ru": high_protein_ru,
            },
        }

    def _seed_recipes(self, users, taxonomy):
        recipe1, _ = Recipe.objects.update_or_create(
            title="Протеиновая овсянка с яйцом",
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
            title="Куриная грудка с гречкой и томатами",
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
            title="Омлет с томатами",
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
            message=f"Рецепт «{recipes['omelet'].title}» ожидает модерации.",
            defaults={"is_read": False},
        )
        Notification.objects.update_or_create(
            user=users["bob"],
            event_type=Notification.EventType.PLAN_MODERATION,
            message=f"План питания №{plans['bob_plan'].id} находится на модерации.",
            defaults={"is_read": False},
        )
        Notification.objects.update_or_create(
            user=users["moderator"],
            event_type=Notification.EventType.NEW_COMPLAINT,
            message="Поступила новая жалоба, требуется проверка.",
            defaults={"is_read": False},
        )
        Notification.objects.update_or_create(
            user=users["alice"],
            event_type=Notification.EventType.COMPLAINT_RESPONSE,
            message="По вашей жалобе опубликован ответ модератора.",
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

    def _seed_bulk_data(
        self,
        *,
        roles,
        taxonomy,
        bulk_users: int,
        bulk_recipes: int,
        bulk_plans: int,
        bulk_reviews: int,
        bulk_favorites: int,
    ):
        users = self._seed_bulk_users(roles, bulk_users)
        if not users:
            return

        recipes = self._seed_bulk_recipes(users, taxonomy, bulk_recipes)
        if not recipes:
            return
        plans = self._seed_bulk_plans(users, recipes, bulk_plans)
        if plans:
            self._seed_bulk_reviews(users, recipes, plans, bulk_reviews)
            self._seed_bulk_favorites(users, recipes, plans, bulk_favorites)
            self._seed_bulk_notifications(users, recipes, plans)

    def _seed_bulk_users(self, roles, count: int):
        first_names = [
            "Алексей",
            "Мария",
            "Ирина",
            "Дмитрий",
            "Екатерина",
            "Сергей",
            "Анна",
            "Ольга",
            "Никита",
            "Татьяна",
            "Артем",
            "Ксения",
        ]
        last_names = [
            "Соколова",
            "Иванов",
            "Петрова",
            "Кузнецов",
            "Морозова",
            "Лебедев",
            "Попова",
            "Васильев",
            "Смирнова",
            "Орлов",
            "Виноградова",
            "Крылов",
        ]
        health_goals_pool = [
            "Сбалансировать рацион и снизить количество сахара.",
            "Поддерживать вес и улучшить качество питания.",
            "Увеличить долю белка и овощей в ежедневном меню.",
            "Составить удобное меню на рабочую неделю.",
            "Контролировать калорийность без строгих ограничений.",
        ]
        health_features_pool = [
            "Непереносимость лактозы",
            "Чувствительность к глютену",
            "Снижение соли",
            "Повышенный белок",
            "Низкоуглеводный режим",
        ]
        favorite_tags_pool = [
            "Завтрак",
            "Быстро",
            "Без глютена",
            "Вегетарианское",
            "Высокобелковое",
            "Без лактозы",
        ]
        users = []
        for idx in range(1, count + 1):
            first_name = first_names[(idx - 1) % len(first_names)]
            last_name = last_names[((idx - 1) // len(first_names)) % len(last_names)]
            user, _ = User.objects.update_or_create(
                email=f"bulk{idx}@foodplanner.local",
                defaults={
                    "name": f"{first_name} {last_name}",
                    "role": roles["user"],
                    "is_staff": False,
                    "is_superuser": False,
                    "health_goals": health_goals_pool[(idx - 1) % len(health_goals_pool)],
                    "avatar_url": f"https://picsum.photos/seed/profile-{idx}/200/200",
                    "health_features": random.sample(health_features_pool, k=random.randint(0, 2)),
                    "favorite_tags": random.sample(favorite_tags_pool, k=random.randint(1, 3)),
                    "email_notifications": bool(idx % 2),
                    "profile_visibility": bool((idx + 1) % 2),
                },
            )
            user.set_password("Password123!")
            user.save(update_fields=["password"])
            users.append(user)
        return users

    def _seed_bulk_recipes(self, users, taxonomy, count: int):
        categories = list(taxonomy["categories"].values())
        ingredients = list(taxonomy["ingredients"].values())
        tags = list(taxonomy["tags"].values())
        title_prefixes = [
            "Теплый салат",
            "Запеченная курица",
            "Овощное рагу",
            "Сытный боул",
            "Домашний суп",
            "Легкий ужин",
            "Белковый завтрак",
            "Паста из цельнозерновой муки",
            "Рис с овощами",
            "Запеканка",
            "Омлет",
            "Гречка с овощами",
            "Куриные котлеты",
            "Филе на гриле",
            "Киноа-боул",
            "Смузи-боул",
        ]
        title_suffixes = [
            "с зеленью",
            "в средиземноморском стиле",
            "с йогуртовым соусом",
            "с печеными овощами",
            "с пряными травами",
            "с лимонной заправкой",
            "по-домашнему",
            "с легкой остротой",
            "с кунжутом",
            "с томатами",
            "с брокколи",
            "с грибами",
            "с ореховыми нотами",
            "с цитрусовым акцентом",
            "с нежной текстурой",
            "для активного дня",
            "для легкого ужина",
            "для сбалансированного меню",
        ]
        descriptions = [
            "Сбалансированное блюдо с акцентом на вкус и простую подачу.",
            "Рецепт для ежедневного меню: быстро готовится и хорошо насыщает.",
            "Универсальный вариант для обеда или ужина с понятными ингредиентами.",
            "Легкое блюдо на каждый день с гармоничным сочетанием БЖУ.",
        ]
        recipes = []
        for idx in range(1, count + 1):
            author = users[(idx - 1) % len(users)]
            title = (
                f"{title_prefixes[(idx - 1) % len(title_prefixes)]} "
                f"{title_suffixes[((idx - 1) // len(title_prefixes)) % len(title_suffixes)]}"
            )
            recipe, _ = Recipe.objects.update_or_create(
                title=title,
                author=author,
                defaults={
                    "category": categories[idx % len(categories)],
                    "description": descriptions[(idx - 1) % len(descriptions)],
                    "cooking_time": 10 + (idx % 45),
                    "difficulty": [
                        Recipe.Difficulty.EASY,
                        Recipe.Difficulty.MEDIUM,
                        Recipe.Difficulty.HARD,
                    ][idx % 3],
                    "instructions": (
                        "Шаг 1: подготовить и нарезать ингредиенты.\n"
                        "Шаг 2: приготовить на среднем огне до готовности.\n"
                        "Шаг 3: добавить специи по вкусу и подать."
                    ),
                    "nutrition_calories": Decimal(str(220 + idx % 500)),
                    "nutrition_protein": Decimal(str(12 + idx % 45)),
                    "nutrition_fat": Decimal(str(6 + idx % 28)),
                    "nutrition_carbs": Decimal(str(10 + idx % 70)),
                    "status": random.choice(
                        [
                            Recipe.ModerationStatus.APPROVED,
                            Recipe.ModerationStatus.PENDING,
                            Recipe.ModerationStatus.REJECTED,
                        ]
                    ),
                    "is_deleted": False,
                },
            )
            recipe.tags.set(random.sample(tags, k=random.randint(1, min(3, len(tags)))))
            chosen_ingredients = random.sample(ingredients, k=min(len(ingredients), random.randint(2, 4)))
            for ingredient_idx, ingredient in enumerate(chosen_ingredients, start=1):
                RecipeIngredient.objects.update_or_create(
                    recipe=recipe,
                    ingredient=ingredient,
                    defaults={
                        "quantity": Decimal(str(40 + ((idx + ingredient_idx) % 180))),
                        "unit": ingredient.unit or "g",
                    },
                )
            recipes.append(recipe)
        return recipes

    def _seed_bulk_plans(self, users, recipes, count: int):
        plans = []
        plan_types = [
            MealPlan.PlanType.PERSONAL,
            MealPlan.PlanType.FITNESS,
            MealPlan.PlanType.THERAPEUTIC,
        ]
        statuses = [
            MealPlan.Status.DRAFT,
            MealPlan.Status.PENDING,
            MealPlan.Status.APPROVED,
            MealPlan.Status.REJECTED,
        ]
        meal_types = [
            MealPlanItem.MealType.BREAKFAST,
            MealPlanItem.MealType.LUNCH,
            MealPlanItem.MealType.DINNER,
            MealPlanItem.MealType.SNACK,
        ]
        today = date.today()

        for idx in range(1, count + 1):
            owner = users[(idx - 1) % len(users)]
            start_at = today + timedelta(days=(idx % 30))
            duration = 1 + (idx % 7)
            end_at = start_at + timedelta(days=duration - 1)
            plan, _ = MealPlan.objects.update_or_create(
                user=owner,
                plan_type=plan_types[idx % len(plan_types)],
                start_date=start_at,
                end_date=end_at,
                defaults={
                    "total_calories": Decimal(str(1500 + (idx % 1200))),
                    "status": statuses[idx % len(statuses)],
                    "is_deleted": False,
                },
            )

            for day_number in range(1, min(4, duration + 1)):
                for meal_type in meal_types:
                    recipe = recipes[(idx + day_number + len(meal_type)) % len(recipes)]
                    MealPlanItem.objects.update_or_create(
                        meal_plan=plan,
                        day_number=day_number,
                        meal_type=meal_type,
                        recipe=recipe,
                        defaults={"servings": Decimal("1.00")},
                    )
            plans.append(plan)
        return plans

    def _seed_bulk_reviews(self, users, recipes, plans, count: int):
        review_comments = [
            "Отличный рецепт, добавил его в регулярное меню.",
            "Понравилась подача и баланс вкуса, буду готовить снова.",
            "Хороший вариант на каждый день, готовится без сложностей.",
            "Вкусно и сытно, особенно понравилось сочетание ингредиентов.",
            "Рецепт рабочий, в следующий раз добавлю больше специй.",
            "План питания удобный, все блюда логично распределены по дням.",
            "Отличная основа для недели, легко подстроить под себя.",
        ]
        for idx in range(1, count + 1):
            user = users[(idx - 1) % len(users)]
            target_type = Review.TargetType.RECIPE if idx % 2 else Review.TargetType.MEAL_PLAN
            target = recipes[idx % len(recipes)] if target_type == Review.TargetType.RECIPE else plans[idx % len(plans)]
            Review.objects.update_or_create(
                user=user,
                target_type=target_type,
                target_id=target.id,
                defaults={
                    "rating": 1 + (idx % 5),
                    "comment": review_comments[(idx - 1) % len(review_comments)],
                    "is_approved": bool(idx % 3),
                    "is_deleted": False,
                },
            )

    def _seed_bulk_favorites(self, users, recipes, plans, count: int):
        for idx in range(1, count + 1):
            user = users[(idx - 1) % len(users)]
            is_recipe = bool(idx % 2)
            target_type = Favorite.TargetType.RECIPE if is_recipe else Favorite.TargetType.MEAL_PLAN
            target = recipes[idx % len(recipes)] if is_recipe else plans[idx % len(plans)]
            Favorite.objects.update_or_create(
                user=user,
                target_type=target_type,
                target_id=target.id,
                defaults={},
            )

    def _seed_bulk_notifications(self, users, recipes, plans):
        for idx, user in enumerate(users[: min(len(users), 100)], start=1):
            plan = plans[idx % len(plans)]
            recipe = recipes[idx % len(recipes)]
            Notification.objects.update_or_create(
                user=user,
                event_type=Notification.EventType.PLAN_MODERATION,
                message=f"Статус вашего плана №{plan.id}: {plan.status}.",
                defaults={"is_read": bool(idx % 2)},
            )
            Notification.objects.update_or_create(
                user=user,
                event_type=Notification.EventType.RECIPE_MODERATION,
                message=f"По рецепту «{recipe.title}» обновлен статус модерации.",
                defaults={"is_read": bool((idx + 1) % 2)},
            )
