# Pilot and exploratory study guide

This is a preparation document. It contains no participants or findings.

## Questions

Main: How do university students understand waste prevention through a gesture-controlled comic game about a day in campus life?

- Can they distinguish acquiring less, continuing use and recycling discarded items?
- Do they understand why an earlier choice changes a later option?
- Where do gesture selection, pauses and black-screen transitions help or hinder?

## Before any participant

Confirm the actual course brief, participant eligibility, consent procedure, recording/storage requirements and submission format. Plan a small exploratory sample only after that check. Try one pilot to assess legibility, game duration, hand fatigue, transition pacing and the probe wording. Record the app/model version; do not pool changed versions without explanation.

Run on the actual webcam and display. Check the cover, the packing, travel, printing, checkout, spare-dinner and final-tidying scenes and all summary pages. Check the 1366×768 and 1280×720 targets, including the longest three-choice screen. Confirm the last option is reachable. Never shrink the whole browser merely to make it fit. Check the report ZIP can be downloaded and opened on that browser.

## Explain and consent

“This is an exploratory class prototype about daily waste choices. You can take your time, rest your hand, pause or end. Your participation is voluntary. The device records the actions you choose, timing, pauses and short responses. It does not save your video, photographs, hand landmarks or real name. I will explain separately how the study records will be stored, used and withdrawn. Please ask anything before deciding.”

Use a participant code. Keep identity mappings separately. Researcher explains the actual withdrawal procedure and any separately collected observation/interview records. Do not promise an unimplemented retention period or assume the course consent rules.

## Session procedure

1. Enter research mode with gestures. Select the code and decide whether to enable knowledge checks. Alternate A→B and B→A across participants if appropriate; record the assigned order.
2. Obtain consent and complete practice: point, pinch, release, make a fresh selection.
3. Complete the optional pre-check without corrections.
4. Play the seventeen-scene story. Do not tell the participant which option to choose. Record directly observed issues and their own explanations separately. “No tracking” alone does not identify a failed pinch or intent.
5. Complete the optional post-check, then four 1–5 ratings. Normal navigation then opens the full summary.
6. Inspect the summary and export the ZIP using the gesture control on page four. Keep genuine observations and interview records separately.
7. Conduct the short interview below. If replay is offered, treat it as a separate child/free-play session, not a replacement for the first study session.

The intended session duration is a planning estimate, not a requirement or result. Allow rest and overruns. The game has no answer timeout.

## Observation fields

Use observation.csv or a separate notebook. Record timestamps, scene ID, what was directly seen, exact participant words where actually spoken, researcher help, and contextual factors. Distinguish your interpretation from observation. Do not invent failed pinches from cursor travel or long decision times.

## Interview prompts

- Tell me about an early choice that affected a later part of your day.
- What is the difference between getting fewer things, keeping a useful thing and recycling it?
- Which outcome surprised you? What did you think it meant?
- Did any option depend on facilities or resources you do not have in real life?
- Did the game ever choose something different from what you intended? Describe that moment.
- What did the black-screen changes tell you? Were any too slow or confusing?
- How did your hand or arm feel? When did you want a rest?
- What would you change first?

Use non-leading follow-ups such as “What made you think that?” Avoid telling participants what they learned.

## Analysis

Recompute each exported JSON using `python analyze_story.py session.json`. Multiple paths produce a participant table; free play and replays are identified separately. Preserve partial records and missing values. Check versions before pooling. Present individual counts, denominators, medians and ranges where meaningful. Food servings and non-food types have different units. Choosing fewer items is not by itself evidence of understanding.

Use actual observation/interview records for iterative reflexive thematic analysis: familiarise, code, build candidate themes, review, define and write. Revisit stages as needed and acknowledge the researcher's developer/environmental perspective. Do not pre-fill themes or quotations. Combine logs with what participants said when interpreting slow scenes, errors and help.

Without a control group, immediate changes cannot establish causation. One session cannot establish long-term waste reduction. A single input condition cannot show that gestures are better than a mouse. The available facilities, English wording, social expectations, researcher relationships and prototype artwork limit interpretation.
