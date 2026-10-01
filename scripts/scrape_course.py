import requests
from bs4 import BeautifulSoup, Tag
from urllib.parse import urljoin
from models import CourseRecord

BASE_URL = "https://www.sjsu.edu/cs/students/syllabi/fall-2026.php"

def fetch_page(url: str) -> BeautifulSoup:
    response: requests.Response = requests.get(url, timeout=15)
    response.raise_for_status()

    soup: BeautifulSoup = BeautifulSoup(
        response.text, "html.parser"
    )
    return soup



def parse_content(url: str) -> list[CourseRecord]:
    soup: BeautifulSoup = fetch_page(url)

    ## Extracted table 
    table: Tag | None = soup.find("table")

    if table is None:
        raise ValueError("Table not found!")

    # Grabs each row from tables and populates courses
    rows: list[Tag] = table.find_all("tr")
    courses: list[CourseRecord] = []

    for row in rows:
        cells: list[Tag] = row.find_all("td")

        if len(cells) != 5:
            continue

        course: CourseRecord = {
            "course": cells[0].get_text(strip=True),
            "section": cells[1].get_text(strip=True),
            "instructor": cells[2].get_text(strip=True),
            "mode": cells[3].get_text(strip=True),
            "syllabus_url": None
        }

        courses.append(course)

    return courses


if __name__ == "__main__":
    courses: list[CourseRecord] = parse_content(BASE_URL)

    for course in courses:
        print(course)



    # courses: list[dict] = parse_content(BASE_URL)
    # print(courses)

