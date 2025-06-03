from django.contrib import admin
from .models import TaskList, Task, SubTask
# Register your models here.

# admin.site.register(TaskList)
admin.site.register(Task)
admin.site.register(SubTask)


