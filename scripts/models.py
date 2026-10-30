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
    title: str


class Professor(TypedDict):
    name: str


class CourseOffering(TypedDict):
    course_id: int
    professor_id: int
    semester_id: int
    section_number: str
