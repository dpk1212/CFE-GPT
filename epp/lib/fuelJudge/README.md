# Fuel judge portal, portable core

This folder is the Fuel review logic to build into the CFE Entrepreneurial Practice Programs app (`dpk1212/CFE-GPT`, `epp/` only). It is not an I-Corps feature. Do not put it in `dpk1212/Great-Lakes-I-Corps`.

Drop these files under something like `epp/lib/fuelJudge/`. Build the screens at `epp` `/judge` and the stage config at `epp` `/admin`. Reuse the existing `epp_session` cookie. Do not restyle the landing, `/login`, or `/request` pages. Another pass is branding those.

No Zoho calls run unless the env flags below are set. Tests use the mock catalog and never call the live writer.

Run the tests with `npx tsx --test fuelJudge.test.ts` from this folder. Imports use `.js` specifiers so Node ESM and `tsx` resolve the `.ts` files.

## What each file does

| File | Role |
| --- | --- |
| `types.ts` | Stage config, application shape, written and pitch review inputs, allowed pipelines, statuses, and columns. |
| `defaults.ts` | The two stages and their default columns, statuses, and pipelines. |
| `mapping.ts` | Deal row to application, review input to the `Application_Review` payload, validation. |
| `catalog.ts` | Fake applications (Harbor Lamp, Northwind Sensor, Paper Kite, Glass Orchard, Cedar Route, Low Tide). Sample data only. |
| `store.ts` | In-memory stage config and the local submission log used when CRM writes are off. |
| `service.ts` | Dashboard query, submit, and the live COQL read / create. Gated. |
| `http.ts` | Method and action switch. The caller supplies the signed-in reviewer. |
| `fuelJudge.test.ts` | Stage filters, both payloads, column config, and a proof the live writer is not called. |

`http.ts` actions: `GET dashboard`, `PUT config`, `POST reviews`.

## Zoho CRM field mapping

Fuel data is in the CFE Zoho org, not the Great Lakes I-Corps org. Do not point the Great Lakes `ZOHO_*` client at this.

Applications are the **Deals** module. Reviews are the **Application_Review** module. Pipeline for this desk is **Fuel** unless an admin includes another pipeline.

### Deal fields read onto the table

| CRM API name | Label / use |
| --- | --- |
| `id` | Application id. Written back as `Application1`. |
| `Project_Name` | Project Name. Also copied to `Reviewed_Project` so the linker matches the exact name. |
| `Stage` | The status picklist. This is the filter, not `Fuel_Application_Status` (that field is text and is not used). |
| `Pipeline` | `Fuel`, `Fuel Consumer IT`, or `Fuel Jumpstart`. Default is `Fuel` only. |
| `Number_of_Application_Reviews` | Total Reviews. |
| `One_Sentence_Project_Summary` | One Sentence Project Summary/VP. |
| `Project_Industries` | Project Industries. |
| `PDF_URL` | Fuel Application link. |
| `What_Funding_Are_You_Requesting` | Funding Requested. |
| `Budget_URL` | Budget URL. |
| `Quad_Chart` | Quad Chart URL. |
| `Technical_Evidence_URL` | Technical Evidence URL. |
| `Proof_of_Traction_URL` | Proof of Traction URL. |
| `Images_URL` | Images. |
| `Supporting_URL` | Pitch Deck. The file-upload field is not the column. |
| `Video_demo_etc_URL` | Video. |
| `Additional_Doc_URL` | Add'l. |

The live read is COQL: `select` those fields `from Deals where Pipeline = 'Fuel' limit 200`. Consumer IT and Jumpstart are not in that query. If an admin turns those pipelines on, the query has to include them.

### Stage names and who is on the desk

| Stage id | Name shown to judges | Form | Default `Stage` values |
| --- | --- | --- | --- |
| `written` | Fuel Written Application Review | `written` | `Ready For Initial Review`, `Out For Initial Review` |
| `pitch` | Fuel Pitch and Funding Feedback | `pitch` | `Invited For Presentation` |

The spec says “Invited to Present”. The CRM value is `Invited For Presentation`.

Stage 1 columns are the deal columns above, including Total Reviews. Stage 2 drops Total Reviews and adds Initial Judge Feedback.

Initial Judge Feedback is not a Deal field. It is built from linked `Application_Review` rows whose `Review_Type` is `Fuel initial judge review`, using `Final_Feedback_or_Outstanding_Questions_for_Team` (prefixed `Strengths:`) and `Areas_for_Improvement` (prefixed `Improve:`). `Initial_Feedback` on the deal was empty on the sample that was checked, so it is not the source. If the feedback COQL fails, the applications still load and the feedback list is empty.

### Both stages, shared review fields

Every submission sets:

| CRM API name | Value |
| --- | --- |
| `Reviewed_Project` | The deal’s `Project_Name`, exact. |
| `Application1` | `{ id: <deal id> }`. Set the id. Do not rely on the fuzzy name search in the CRM linker. |
| `Reviewer_Email` | Signed-in account email, trimmed and lowercased. |
| `Reviewer_First_Name` / `Reviewer_Last_Name` | Split from the account display name. |
| `Status` | `Submitted`. |

The confidentiality checkbox is required in `validateReview` and is not written. No CRM field was found for it.

`How_much_funding` exists on the module and must not be sent. Neither stage has an amount field or an upload.

Creates send `trigger: []` so a field-update workflow does not rename the row. The create workflow that links a review to its deal can still run on its own schedule.

### Stage 1, Fuel Written Application Review

| Form | CRM API name | Stored value |
| --- | --- | --- |
| Record name | `Name` | `Fuel Initial Review_<Project_Name>` (120 characters). |
| Review type | `Review_Type` | `Fuel initial judge review`. |
| Conflict, required | `Conflict_of_Interest` | `Yes` or `No`. |
| Problem Validation & Customer Discovery, sections 1–2 | `Rating_for_Potential_for_Positive_Impact` and `Positive_Impact_Feedback` | Rating text below. Feedback optional. |
| Solution & Value Proposition, sections 3–4 | `Rating_for_Value_Proposition` and `Value_Proposition_Feedback` | Same. |
| Market Entry & Business Model, sections 5–6 | `Sustainability_and_Viability_of_the_Venture` and `Viability_Feedback` | Same. |
| Freedom to Operate, section 7 | `Rating_for_Freedom_to_Operate` and `Feedback_for_Freedom_to_Operate` | Same. |
| Execution Plan & Budget Fit, section 9 | `Rating_for_Go_to_Market` and `Feedback_for_Go_to_Market` | Same. The API name says go-to-market. The label in CRM is “Rating for 12 Week Plan & Budget”. |
| Strengths & Highlights, shared with the applicant | `Final_Feedback_or_Outstanding_Questions_for_Team` | Optional text. |
| Areas for Improvement, shared with the applicant | `Areas_for_Improvement` | Optional text. |
| Should this team advance | `Should_This_Team_Advance_to_Presenting` | `Yes, this team/project should advance` or `No, this team has more work to do`. |
| Coach or contact | `Do_you_Know_a_Good_Coach_for_This_Team` | Optional text. |
| Internal notes | `Internal_Notes` | Optional. Not shown to applicants. |

Rating text, matching rows already in CRM:

| Score | Stored text | Scale shown to the judge |
| --- | --- | --- |
| 1 | `1 = Unclear` | Missing / Unclear |
| 2 | `2 = Limited` | Weak / Limited |
| 3 | `3 = Adequate` | Clear / Adequate |
| 4 | `4 = Strong` | Strong / Compelling |
| 5 | `5 = Exceptional` | Exceptional / Pitch-Ready |

`Rating_for_Action_Plan_Progressive_Dev_Financial` and `Rating_for_Team_Capability` are other rating fields. This five-category form does not write them.

### Stage 2, Fuel Pitch and Funding Feedback

Page 1 is the same identity, conflict, confidentiality, and project. Conflict is optional on this stage. Page 2 has no ratings. Page 3 is CFE Direct Support.

| Form | CRM API name | Stored value |
| --- | --- | --- |
| Record name | `Name` | `Fuel Presentation Review_<Project_Name>` (120 characters). |
| Review type | `Review_Type` | `Funding Recommendation`. |
| Conflict, optional | `Conflict_of_Interest` | `Yes`, `No`, or null. |
| What did the team do well? | `Final_Feedback_or_Outstanding_Questions_for_Team` | Optional. There is no separate “presentation strengths” field. This is a new review row, so it does not overwrite the stage 1 row. |
| What should this team prioritize? | `Areas_for_Improvement` | Optional. |
| Coach or contact | `Do_you_Know_a_Good_Coach_for_This_Team` | Optional. Help text: if they already named someone on the written review, they do not need to repeat it. |
| Should this team receive Fuel funding? | `Funding_Recommendation` | `Yes` or `No, not at this time`. Required. |
| Internal notes | `Internal_Notes` | Optional. Kept internal to CFE Fuel staff. Milestones or a min/max can be written here. There is still no amount field. |

## Env vars

Names only. Set them on the Vercel project `cfe-epp`. Do not commit them, do not put them on the briefing project, and do not read them from a Great Lakes env file.

| Name | Purpose |
| --- | --- |
| `FUEL_CRM_MODE` | `live` reads CFE Deals. Any other value, including unset, uses `catalog.ts`. |
| `FUEL_CRM_WRITES` | `1` allows creates. Anything else keeps the submission in the local log. |
| `FUEL_ZOHO_API_DOMAIN` | CFE CRM API host, no trailing slash. |
| `FUEL_ZOHO_ACCOUNTS_URL` | CFE accounts host used to refresh a token. |
| `FUEL_ZOHO_CLIENT_ID` | CFE OAuth client. |
| `FUEL_ZOHO_CLIENT_SECRET` | CFE OAuth secret. |
| `FUEL_ZOHO_REFRESH_TOKEN` | CFE refresh token. |

## How read and write gating works

`fuelCrmMode()` is `live` only when `FUEL_CRM_MODE` is exactly `live`. Otherwise `listApplications` returns the sample catalog.

`fuelWritesEnabled()` is true only when mode is `live` and `FUEL_CRM_WRITES` is exactly `1`.

`submitFuelReview` always builds the CRM record. If writes are off, it stores that record in memory and returns `{ wrote: false, id: "local-N" }`. The injected `createReview` is not called. If writes are on, it `POST`s one row to `{FUEL_ZOHO_API_DOMAIN}/crm/v8/Application_Review` with `{ data: [record], trigger: [] }`.

A live read refreshes an access token with `grant_type=refresh_token` against `{FUEL_ZOHO_ACCOUNTS_URL}/oauth/v2/token`, then runs COQL. Missing env vars throw `Fuel CRM is not configured.` A failed refresh throws `Fuel CRM credentials were not accepted.` Tests delete `FUEL_CRM_MODE` and `FUEL_CRM_WRITES` before each case.

Do not turn writes on for tests or for a production smoke test. Dale has to approve CRM writes.

## EPP adaptations

In `epp/`, config and dry-run submissions persist in Vercel Blob at `epp/fuel-judge.json` (or `EPP_FUEL_STORE_PATH` / `/tmp/epp-fuel-judge.json` locally). Route handlers live under `/api/judge/*` and `/api/admin/fuel-config`. Pass `authOpen: false` and read the reviewer from `epp_session`.

## What has to change for the Next.js App Router app

This library does not know about Clerk, the I-Corps Hub, or Express. Leave those out.

1. Session. Read `epp_session` in the route handlers. Judges may load the dashboard and submit. Only an admin may `PUT` config. `http.ts` treats `authOpen: true` as an open admin, which was the Hub behavior when Clerk was unset. Pass `authOpen: false` in EPP. Do not invent a preview judge.
2. Identity. Join a Zoho contact to the account on the normalized email, then pass `{ email, name }` into `submitFuelReview`. The judge does not type an email. `Reviewer_Email` is that normalized address.
3. Routes. Add App Router handlers for the dashboard, config, and review submit. Wire them to `handleFuelJudge` or call `fuelDashboard` / `submitFuelReview` / `updateFuelConfig` directly. Guard `/judge` and `/admin` with the middleware that is already there. `/judge` is the placeholder to replace. Stage config belongs in `/admin`, next to the existing request approval, not instead of it.
4. Pages. The Vite components that were drafted for the I-Corps hub are not in this folder and should not be copied. Build the table and the two native forms in `epp`. Stage 1 is three pages: identity and confidentiality, five rubric ratings with the scale text, then strengths, improvements, advance, coach, and internal notes. Stage 2 is three pages: the same identity block, the three optional text areas, then CFE Direct Support. Full rubric copy is in the stage 1 spec the product owner already sent.
5. Config storage. `store.ts` is a process singleton. On Vercel it resets between invocations and is not shared. Replace it with a durable store before admins rely on it. Do not keep it in a Great Lakes contact description.
6. Picklists. Live written reviews use `Review_Type` `Fuel initial judge review` and `Status` `Submitted`. The current picklists do not list those values (`Review_Type` includes `Funding Recommendation`; `Status` is `Requested` and `Complete`). A create can be rejected even though old rows have those strings. `Funding Recommendation` is on the picklist, which is why stage 2 uses it. Confirm both strings before the first live write.
7. Total Reviews. `Number_of_Application_Reviews` is filled by the existing Deluge linker after a review is linked, counting linked reviews. A stage 2 row with `Application1` set will be included in that count. That is a product question, not something this payload sets.
8. Org boundary. This client is only the `FUEL_ZOHO_*` variables above. Do not reuse the I-Corps read-only token, and do not deploy these variables to the briefing site.
