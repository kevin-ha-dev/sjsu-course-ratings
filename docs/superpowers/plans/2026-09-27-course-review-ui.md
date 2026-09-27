# Course Review UI First-Draft Plan

**Status:** Implemented and verified on `feature/course-review-ui`.

**Goal:** Build one course review page with working add/edit review interactions, faithful to the two supplied mockups.

**Architecture:** Use the existing Next.js, React, TypeScript, Tailwind, and Lucide stack. Keep sample course/review data in a small module, page interactions in one client component, and the shared add/edit form in one dialog component. Store changes in React state for this draft; refreshing resets the sample data.

**References:** The two supplied mockups define the visual design. `C:/Users/hurri/OneDrive/School/CS160_SWE/proj_doc.pdf` supplies project context, not additional implementation instructions. The user confirmed that adding/editing means course reviews, not course records.

## Scope And Approach

- Recommended: an interactive UI prototype using sample data. It demonstrates the complete add/edit flow with minimal setup.
- A static mockup would demonstrate appearance but would not exercise adding/editing.
- Connecting review storage and authorization now would expand this beyond the requested first draft.
- Include viewing reviews, adding a review, editing the demo user's own review, basic validation, and responsive layout.
- Defer database/API work, new authentication behavior, deleting reviews, filtering, sorting, pagination, and other features from the project document.
- This is a UI demo, not an implementation of secure review ownership or persistent storage.

## Visual Design

- Match the black top bar, prominent SJSU Course Ratings branding, rounded search field, and Log In link.
- Give the course detail page this header while keeping the existing navigation on other pages. The search control may navigate among the small sample course set; it does not require a new search results page. Log In links to the existing login page.
- Keep a white/off-white page, left-aligned course title, compact rating/count/difficulty summary, Reviews heading, and black Rate button with an arrow.
- Use broad alternating gray review rows, close to the mockup's proportions. Populate them with short sample reviews, professor names, and compact rating details.
- Use a large white modal over a dark backdrop, with a single left-aligned form column and the mockup's circular rating controls.
- Add the necessary Submit/Save Changes, Cancel, and close controls. Use a small pencil icon with an accessible name and tooltip on editable reviews.
- Preserve the layout on desktop; let the header wrap and the modal scroll on small screens. Keep all controls reachable without horizontal scrolling.

## Form And Behavior

- Match the mockup fields: Class Difficulty (1-5), Career Relevancy (1-5), Attendance Mandatory (Yes/No), Grade Leniency (1-5), Professor, and Write a Review.
- Proposed small addition: Overall Rating (1-5), so the summary's average rating has a direct source. The reference document also identifies overall course experience as a rating factor.
- Use native radio inputs styled as circles, with readable scale endpoints; use a native professor select and textarea.
- Rate opens a blank form. Submitting a valid form adds a review immediately, closes the modal, and updates the summary.
- Editing opens the same form with existing values and Save Changes as the submit label. Saving replaces the existing review without increasing the count.
- Show edit controls only for reviews assigned to the local demo user. Other sample reviews remain read-only.
- Require the rating selections, attendance choice, professor, and non-whitespace review text; show concise field errors for omissions.
- Cancel, close, or Escape discards unsaved form changes. Reopening starts from blank values or the saved review.
- Use a native dialog with keyboard focus contained while open and returned to the trigger on close.
- Calculate count and average overall rating from the displayed dataset. For this draft, difficulty percentage is average difficulty divided by 5, multiplied by 100. Show an unrated state when there are no reviews.

## Implementation Steps

- [x] Restore the existing locked dependencies and read the relevant bundled Next.js routing, layout, and client-component guides.
- [x] Add a small typed sample-data module at `src/lib/course-review-data.ts`, including CS 160 and the course IDs already linked in the app. Keep aggregate values consistent with the reviews.
- [x] Move the course detail route from `src/app/(app)/courses/[courseId]/page.tsx` to `src/app/(course-review)/courses/[courseId]/page.tsx`, retaining the `/courses/[courseId]` URL. This lets the single page use the mockup header outside the shared sidebar layout. Remove the old route to avoid duplicate URLs.
- [x] Add `src/components/course-review-page.tsx` for the header, summary, review rows, and local review state. Use the route's course ID, and handle unknown courses explicitly.
- [x] Add `src/components/course-review-dialog.tsx` for the shared add/edit dialog, form values, validation, and rating controls. Keep any small rating-field helper in this file.
- [x] Add a CS 160 link to `src/app/(app)/courses/page.tsx` so the draft is reachable from the current course list.
- [x] Check the completed page and modal against both mockups at desktop and mobile widths, then run the existing lint and production-build checks.

## Acceptance Checks

- `/courses/cs-160` shows CS 160 - Software Engineering and the mockup's visual hierarchy.
- A valid submission appears immediately and changes the count and averages.
- Editing preserves the review's identity and count while updating its values and averages.
- Missing required selections or whitespace-only text cannot be submitted.
- Cancel and Escape do not change saved reviews; the dialog works with keyboard navigation.
- Other sample reviews have no edit control; refresh restores the sample dataset.
- Existing course links resolve correctly; unrelated pages retain their current navigation.
- The page and modal have no clipped text or horizontal overflow on narrow screens.

## Execution

Implemented in this branch with the existing dependencies. No database or authentication integration was added.

Verification completed:
- ESLint and the production build passed.
- Browser checks passed for add/edit, required fields and whitespace validation, aggregate updates, cancellation, Escape, focus restoration, refresh reset, search, empty courses, and unknown-course handling.
- Screenshots inspected at desktop width 1386px and mobile widths 390px and 320px. No horizontal overflow; modal controls remain reachable.
- Read-only code review found a low-contrast radio outline, corrected with a neutral border. No other substantive issues were found.

Small layout adjustment: rating-scale endpoints sit side by side so the additional Overall Rating field and submit/cancel controls fit comfortably in the modal.
