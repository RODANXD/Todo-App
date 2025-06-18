from django.db import migrations

def set_default_organization(apps, schema_editor):
    Project = apps.get_model('project', 'Project')
    Organization = apps.get_model('organizations', 'Organization')
    
    # Create default organization if none exists
    default_org, created = Organization.objects.get_or_create(
        name='Default Organization',
        slug='default-organization',
        defaults={'description': 'Default organization for existing projects'}
    )
    
    # Update all projects without organization
    Project.objects.filter(organization__isnull=True).update(organization=default_org)

def reverse_migration(apps, schema_editor):
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('project', '0004_project_end_date_project_is_archived_and_more'),
        ('organizations', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(set_default_organization, reverse_migration),
    ]