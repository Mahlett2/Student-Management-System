from rest_framework import serializers
from .models import Department, Semester, Subject, Class, TimetableEntry


class DepartmentField(serializers.Field):
    """Accepts integer PK or string name for department."""

    def to_representation(self, value):
        return value.pk if value else None

    def to_internal_value(self, data):
        if data is None or data == "":
            return None
        if isinstance(data, int):
            try:
                return Department.objects.get(pk=data)
            except Department.DoesNotExist:
                raise serializers.ValidationError(f"Department with pk={data} does not exist.")
        if isinstance(data, str):
            obj, _ = Department.objects.get_or_create(name=data.strip())
            return obj
        raise serializers.ValidationError("Department must be an integer PK or a name string.")


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"


class SemesterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Semester
        fields = "__all__"


class SubjectSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    department = DepartmentField(required=False, allow_null=True)

    class Meta:
        model = Subject
        fields = "__all__"
        extra_kwargs = {
            "code": {"validators": []},  # skip unique check on update
        }


class ClassSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    department = DepartmentField(required=False, allow_null=True)

    class Meta:
        model = Class
        fields = "__all__"


class TimetableEntrySerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    department = DepartmentField(required=False, allow_null=True)

    class Meta:
        model = TimetableEntry
        fields = "__all__"
