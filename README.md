# SECOND NATURE

*Small choices. An everyday story.*

**[Play Online](https://second-nature-one-day-less-waste.netlify.app/)**

![SECOND NATURE game cover](./SECOND%20NATURE/public/art/narrative/cover.png)

## The Game

Spend a day as a university student, making everyday choices about food, packaging and reusable items across **17 connected comic scenes**.

The story follows breakfast, the journey to school, classes, shopping and an evening at home. What you pack in the morning changes your options later. At the end of the day, see what you acquired, kept, shared or discarded, then review every choice and a practical next step. Travel exhaust is explained separately from rubbish. There is no answer countdown. After each choice, read the black caption panel at your own pace, then point and pinch Continue.

## How to Play

1. Open **[Play Online](https://yantongsecondnature.netlify.app/)** in desktop Chrome or Edge.
2. Allow camera access. Choose **Start a new day**, enter your name and student ID, confirm your course and consent, then complete the practice. **Free play (no participant details)** is a separate option for informal trials.
3. **Point** at an option with either open hand.
4. **Pinch** your thumb and index finger to choose.
5. **Release** before making your next choice.
6. Read the black caption panel, then **point and pinch Continue** when ready.
7. After the final scene, answer the first 15 ratings by **pointing and pinching a score from 1 to 5**. Review the four result pages, choose **Answer final rating**, and rate the clarity of those results before exporting your PDF. Each answer is saved immediately; incomplete exports are labelled.

Already finished an earlier version? Open **Saved days → View / export** to complete any missing ratings. A **Rate my experience** button is also available on results pages while answers are missing.

Camera images are processed on your device and are not recorded.

Use one hand at a time to choose. Switching hands requires opening your fingers before a fresh pinch.

## About the Project

SECOND NATURE is an HCI coursework prototype exploring waste prevention through comic storytelling and gesture interaction.

Save a single PDF at the end of the day: results, explanations of each choice, practical next steps and collected research responses. Original JSON/CSV records and the Python analysis script are embedded in that same PDF. To extract them for coursework, run `python materials/extract_report.py report.pdf --output materials/P01` from the application folder, or use a PDF viewer with an attachments panel. The download works offline without a print dialog.

Built with **Vue 3, TypeScript, Pinia, Vite and MediaPipe**, it connects earlier decisions with later options and tracks individual items throughout the day. Results distinguish new single-use items, discarded materials, food waste and items kept in use.
The revised scene-by-scene story and result rules are in [the story design document](./SECOND%20NATURE/docs/STORY_REDESIGN.md).
