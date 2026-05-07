from rest_framework import serializers
from .models import Result
from academics.models import Department


class DepartmentField(serializers.Field):
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


class ResultSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    department = DepartmentField(required=False, allow_null=True)
    uploaded_by_name = serializers.CharField(source="uploaded_by.full_name", read_only=True)

    class Meta:
        model = Result
        fields = "__all__"
        read_only_fields = ["grade", "uploaded_at"]
