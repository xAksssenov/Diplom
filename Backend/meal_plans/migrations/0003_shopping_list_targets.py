from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("meal_plans", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="shoppinglist",
            name="target_id",
            field=models.PositiveBigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="shoppinglist",
            name="target_type",
            field=models.CharField(
                blank=True,
                choices=[("recipe", "Recipe"), ("meal_plan", "Meal plan")],
                default="",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="shoppinglist",
            name="title",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="shoppinglistitem",
            name="ingredient_name",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AlterField(
            model_name="shoppinglistitem",
            name="ingredient",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="shopping_list_items",
                to="recipes.ingredient",
            ),
        ),
        migrations.AddIndex(
            model_name="shoppinglist",
            index=models.Index(fields=["target_type", "target_id"], name="meal_plans__target__6cbf0f_idx"),
        ),
        migrations.AddConstraint(
            model_name="shoppinglist",
            constraint=models.UniqueConstraint(
                fields=("user", "target_type", "target_id"),
                name="unique_user_target_shopping_list",
            ),
        ),
    ]
