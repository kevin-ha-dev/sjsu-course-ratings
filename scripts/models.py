from typing import TypedDict

class CourseRecord(TypedDict):
    course: str
    section: str
    instructor: str
    mode: str
    syllabus_url: str | None


class Course(TypedDict):
    department: str
    course_number: str
    title: str | None
    description: str | None


class Professor(TypedDict):
    first_name: str | None
    last_name: str
    department: str
    email: str | None


class CourseOffering(TypedDict):
    course_id: int
    professor_id: int
    semester_id: int
    section_number: str
