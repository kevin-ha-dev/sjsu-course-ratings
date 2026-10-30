import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))

from scrape_course import BASE_URL, parse_content

ROOT = SCRIPTS.parent
load_dotenv(ROOT / ".env")
load_dotenv(ROOT / ".env.local", override=True)

COURSE_CODE = re.compile(r"([A-Za-z]+)\s+(.+)")


def split_course(code: str) -> tuple[str, str] | None:
    match = COURSE_CODE.fullmatch(code.strip())
    if match is None:
        return None
    return match.group(1), match.group(2)


def rows_from_scrape():
    courses: dict[tuple[str, str], dict[str, str]] = {}
    professors: dict[str, dict[str, str]] = {}
    offerings: list[dict[str, str]] = []
    seen_offerings: set[tuple[str, str, str]] = set()

    for record in parse_content(BASE_URL):
        parsed = split_course(record["course"])
        if parsed is None:
            continue
        department, course_number = parsed
        name = record["instructor"].strip()
        section = record["section"].strip()
        if not name or not section:
            continue

        courses[(department, course_number)] = {
            "department": department,
            "course_number": course_number,
            "title": course_number,
        }
        professors[name] = {"name": name}

        offering_key = (f"{department} {course_number}", name, section)
        if offering_key in seen_offerings:
            continue
        seen_offerings.add(offering_key)
        offerings.append(
            {
                "department": department,
                "course_number": course_number,
                "name": name,
                "section_number": section,
            }
        )

    return list(courses.values()), list(professors.values()), offerings


def main() -> None:
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise SystemExit(
            "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script."
        )

    course_rows, professor_rows, offering_rows = rows_from_scrape()
    client = create_client(url, key)

    client.table("courses").upsert(
        course_rows, on_conflict="department,course_number"
    ).execute()
    client.table("professors").upsert(professor_rows, on_conflict="name").execute()

    semester = (
        client.table("semesters")
        .select("id")
        .eq("term", "Fall")
        .eq("year", 2026)
        .single()
        .execute()
    )
    semester_id = semester.data["id"]

    saved_courses = client.table("courses").select("id, department, course_number").execute()
    saved_professors = client.table("professors").select("id, name").execute()
    course_ids = {
        (row["department"], row["course_number"]): row["id"] for row in saved_courses.data
    }
    professor_ids = {row["name"]: row["id"] for row in saved_professors.data}

    offering_inserts = [
        {
            "course_id": course_ids[(row["department"], row["course_number"])],
            "professor_id": professor_ids[row["name"]],
            "semester_id": semester_id,
            "section_number": row["section_number"],
        }
        for row in offering_rows
    ]
    client.table("course_offerings").upsert(
        offering_inserts,
        on_conflict="course_id,professor_id,semester_id,section_number",
    ).execute()

    print(
        f"Upserted {len(course_rows)} courses, {len(professor_rows)} professors, "
        f"and {len(offering_inserts)} offerings."
    )


if __name__ == "__main__":
    main()
