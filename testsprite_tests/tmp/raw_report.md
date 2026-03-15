
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** Pagina_Siglo21
- **Date:** 2026-03-15
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Navbar link navigates from Home to FAQ
- **Test Code:** [TC001_Navbar_link_navigates_from_Home_to_FAQ.py](./TC001_Navbar_link_navigates_from_Home_to_FAQ.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/01f63928-e9bb-4933-9e09-3e5856f83681/136d22e7-5afd-49ef-ab08-18013bc23d45
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Navbar link navigates from Home to Contacto
- **Test Code:** [TC003_Navbar_link_navigates_from_Home_to_Contacto.py](./TC003_Navbar_link_navigates_from_Home_to_Contacto.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/01f63928-e9bb-4933-9e09-3e5856f83681/5313374b-772e-4dce-8be1-677854d13561
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Mobile hamburger menu opens and navigates to Clases de Apoyo
- **Test Code:** [TC004_Mobile_hamburger_menu_opens_and_navigates_to_Clases_de_Apoyo.py](./TC004_Mobile_hamburger_menu_opens_and_navigates_to_Clases_de_Apoyo.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/01f63928-e9bb-4933-9e09-3e5856f83681/e8869c84-3016-4946-b1f7-82e2d1d87393
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Filter careers by category tab and fuzzy search shows matching cards
- **Test Code:** [TC007_Filter_careers_by_category_tab_and_fuzzy_search_shows_matching_cards.py](./TC007_Filter_careers_by_category_tab_and_fuzzy_search_shows_matching_cards.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Careers catalog UI not rendered — page DOM contains 0 interactive elements, preventing verification of filtered results.
- Search results could not be observed because the page content is not present; the text 'Administración' is not visible.
- No career card elements are visible on the page; at least one career card is required to confirm filtering behavior.
- SPA content failed to load after multiple waits and interactions, blocking further testing.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/01f63928-e9bb-4933-9e09-3e5856f83681/786c1466-337b-49fe-add7-8ddd6fd1e2c1
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Search with gibberish shows No results state
- **Test Code:** [TC009_Search_with_gibberish_shows_No_results_state.py](./TC009_Search_with_gibberish_shows_No_results_state.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/01f63928-e9bb-4933-9e09-3e5856f83681/9f8cc277-6eaa-4b57-9734-51aae3225fd3
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Open career detail modal from a career card
- **Test Code:** [TC010_Open_career_detail_modal_from_a_career_card.py](./TC010_Open_career_detail_modal_from_a_career_card.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/01f63928-e9bb-4933-9e09-3e5856f83681/1ca7c311-137a-4b6f-b228-e3c285851376
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Carousel navigation in modal moves to next career and modal can be closed
- **Test Code:** [TC011_Carousel_navigation_in_modal_moves_to_next_career_and_modal_can_be_closed.py](./TC011_Carousel_navigation_in_modal_moves_to_next_career_and_modal_can_be_closed.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Carousel navigation controls (Next button and pagination dots) do not advance the modal carousel; the modal heading remained 'ABOGACÍA' instead of changing to the next career.
- Keyboard navigation (ArrowRight) did not advance the carousel; no change in modal content was observed.
- The share URL input inside the modal remained pointing to '?carrera=Abogacia', indicating the selected career did not change after navigation attempts.
- Multiple distinct navigation methods were attempted (button controls, pagination dots, keyboard) with no UI evidence of slide change; expected behavior of carousel advancement was not observed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/01f63928-e9bb-4933-9e09-3e5856f83681/b386bd6c-978f-412e-aa70-1dc61e6731b8
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Submit enrollment successfully with 'grado' + 'Administración' and equivalencias checked
- **Test Code:** [TC015_Submit_enrollment_successfully_with_grado__Administracin_and_equivalencias_checked.py](./TC015_Submit_enrollment_successfully_with_grado__Administracin_and_equivalencias_checked.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/01f63928-e9bb-4933-9e09-3e5856f83681/8b294ee4-999a-416a-a597-46bd5fd7805e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Full form completion including phone, city, career type filter, career search, and equivalencias toggle
- **Test Code:** [TC016_Full_form_completion_including_phone_city_career_type_filter_career_search_and_equivalencias_toggle.py](./TC016_Full_form_completion_including_phone_city_career_type_filter_career_search_and_equivalencias_toggle.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/01f63928-e9bb-4933-9e09-3e5856f83681/89ccb745-063b-4691-85ab-983355fef868
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018 Validation: email is required
- **Test Code:** [TC018_Validation_email_is_required.py](./TC018_Validation_email_is_required.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/01f63928-e9bb-4933-9e09-3e5856f83681/da390170-6195-459f-b8e7-2e0a2d7e4a34
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019 Validation: invalid email format is rejected
- **Test Code:** [TC019_Validation_invalid_email_format_is_rejected.py](./TC019_Validation_invalid_email_format_is_rejected.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Visible validation message for the email field not found on page after submitting the form (no inline error text or notification present).
- Submit button remained in 'Enviando...' state and no user-facing client-side validation error was displayed to indicate the incorrect email format.
- Although the email input has invalid=true, there is no visible error message element (or accessible error text) informing the user about the invalid email format.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/01f63928-e9bb-4933-9e09-3e5856f83681/98bb6d23-70c0-4bfb-a950-ea55d53393ca
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC023 FAQ page loads and displays a list of questions
- **Test Code:** [TC023_FAQ_page_loads_and_displays_a_list_of_questions.py](./TC023_FAQ_page_loads_and_displays_a_list_of_questions.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/01f63928-e9bb-4933-9e09-3e5856f83681/1682894f-a0eb-461a-b6b4-7e7b11c7b919
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC024 Expand an FAQ question to reveal its answer
- **Test Code:** [TC024_Expand_an_FAQ_question_to_reveal_its_answer.py](./TC024_Expand_an_FAQ_question_to_reveal_its_answer.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/01f63928-e9bb-4933-9e09-3e5856f83681/c85590e4-3a66-44b4-bdc5-1623badbac27
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC025 Collapse an expanded FAQ question by clicking it again
- **Test Code:** [TC025_Collapse_an_expanded_FAQ_question_by_clicking_it_again.py](./TC025_Collapse_an_expanded_FAQ_question_by_clicking_it_again.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Clicking the FAQ question '¿Dónde queda el CAU Villa Lugano?' did not collapse the answer; the answer text remained visible after the first click.
- A second click also failed to collapse the answer; answer content remained visible after the second click.
- The FAQ button's expanded attribute remained true, indicating the collapse action did not toggle the state.
- No alternate UI control was identified on the page to collapse that specific FAQ entry.
- Two allowed collapse attempts were executed and neither hid the answer content.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/01f63928-e9bb-4933-9e09-3e5856f83681/7840c4e8-5b31-4cc0-b1c9-3bd5eb526d2d
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC027 Submit a new FAQ question successfully
- **Test Code:** [TC027_Submit_a_new_FAQ_question_successfully.py](./TC027_Submit_a_new_FAQ_question_successfully.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/01f63928-e9bb-4933-9e09-3e5856f83681/d027505a-9ada-4be2-836b-b1eed02df87d
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **73.33** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---