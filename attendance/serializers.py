from rest_framework import serializers
from .models import AttendanceSession, AttendanceRecord
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


class AttendanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = "__all__"
        read_only_fields = ["session"]


class AttendanceSessionSerializer(serializers.ModelSerializer):
    records = AttendanceRecordSerializer(many=True, required=False)
    department_name = serializers.CharField(source="department.name", read_only=True)
    department = DepartmentField(required=False, allow_null=True)
    marked_by_name = serializers.CharField(source="marked_by.full_name", read_only=True)
    present_count = serializers.IntegerField(read_only=True)
    absent_count = serializers.IntegerField(read_only=True)
    late_count = serializers.IntegerField(read_only=True)
    total_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = AttendanceSession
        fields = "__all__"
        read_only_fields = ["marked_by", "created_at"]

    def create(self, validated_data):
        records_data = validated_data.pop("records", [])
        session = AttendanceSession.objects.create(**validated_data)
        for r in records_data:
            r.pop("session", None)
            AttendanceRecord.objects.create(session=session, **r)
        return session

    def update(self, instance, validated_data):
        records_data = validated_data.pop("records", None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if records_data is not None:
            instance.records.all().delete()
            for r in records_data:
                r.pop("session", None)
                AttendanceRecord.objects.create(session=instance, **r)
        return instance


class StudentAttendanceSerializer(serializers.ModelSerializer):
    session_date = serializers.DateField(source="session.date", read_only=True)
    class_name = serializers.CharField(source="session.class_name", read_only=True)
    subject = serializers.CharField(source="session.subject", read_only=True)
    department_name = serializers.CharField(source="session.department.name", read_only=True)
    teacher_name = serializers.CharField(source="session.marked_by.full_name", read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = [
            "id", "session", "session_date", "class_name", "subject",
            "department_name", "teacher_name", "status",
        ]
