from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0002_seed_roles"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="avatar_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="user",
            name="email_notifications",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="user",
            name="favorite_tags",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="user",
            name="health_features",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="user",
            name="profile_visibility",
            field=models.BooleanField(default=False),
        ),
    ]
