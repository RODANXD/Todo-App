from django.contrib import admin
from .models import Project,TaskList, ChatRoom
# Register your models here.

admin.site.register(Project)
admin.site.register(TaskList)
admin.site.register(ChatRoom)
admin.site.site_header = "Todo Admin"