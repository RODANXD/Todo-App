from django.apps import AppConfig

class SchedulingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'scheduling'

    def ready(self):
        # Import signal handlers
        from . import signals
