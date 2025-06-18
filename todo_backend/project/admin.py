from django.contrib import admin
from .models import Project,TaskList
# Register your models here.

admin.site.register(Project)
admin.site.register(TaskList)
admin.site.site_header = "Todo Admin"