# Mahfod App UX/UI Clarification Questionnaire

Please write your answers below each question. You can use the 14 screenshots in your `old mahfod app` folder as reference. 

---

## 1. Quran Screen (القرآن)
*What does the Quran screen look like, and how does the user interact with it?*
- Does it contain a full readable Quran?
- Can users long-press Ayahs to save them to their Memos?
- **Your Answer:** 
since quran section in mahfold app was only trial , you can skip every thing about it we will develop it later from scratch

## 2. Library (المكتبة) vs. Memos (محفوظ)
*Currently, we have a "Shelf/Cover" view for Memos. How does the Library screen differ?*
librery in main footer tab contains notes that are tooken from book noter (mahfod features) when user can take notes while reading books or watching , thi is the flow: add book/video ( title ,author, field) noter is open: a dynamic drawer shows up from th bottom with it user add notes in specific chapters and can add the page number, in video can add time -- then notes appears in an organized way -- user can delete edit notes or even send it to memo for a rep session
- Is the Library used for tracking external physical books, PDFs, or YouTube videos? no , its used to takes notes so student at the end has a resume of the book can be exported as pdf section 
- What actions can a user take in the Library screen? he can add books videos delete them share them export the as pdf fav them
- **Your Answer:** 


## 3. Tools Screen (الأدوات) 
*What specific features exist on the Tools screen?*
- Does it include Statistics, Backup/Sync, Quiz Settings, or something else?
- **Your Answer:** 
just leave it like we said in quran section we will develop it later from scratch       
## 4. The "Add Memo" Flow (Center FAB / `+` Button)
*When the user taps the yellow `+` button in the center of the navigation bar, what exactly happens?*
- Does a modal slide up, or does it navigate to a full screen? full screen called addmemo : title , body, upload image (optional), record audio (optional) start rep if that button is clicked learnscreen opens and the rep session starts
- What input fields do they fill out? (e.g., Title, Text, Categories like "متن", "فقه"?) is all that
- Is there a way to add audio or image attachments?
audio is recoreded from user voice , so the voice is repeted in each time until lrep number ends, user can select audio speed can pause play but cant press Rep untill the audio ends to count it as a rep
- **Your Answer:** 
this is the most improtant part of the app to be honest with you 
the new add memo is stored in memos page as a good looking librery view page as you see in screenshots we provided but you must add options to change the view to grid view or list view 

## 5. The Floating Bubble UX
*How is the floating bubble actually used by the user during the app's lifecycle?*
- Is it meant to be used while reading *other* apps (like a PDF reader or web browser) outside of Mahfod? 
no bubble works like outside rep counter when learnscreen is open (rep session) if user goes outside the bubble shows up to count reps
- When they tap the bubble, does a mini "Add Note" window pop up so they can quickly capture thoughts? non no its only count reps 
- **Your Answer:** 


## 6. General User Journey
*When a user opens the app, what is the first screen they see (after the splash/auth), and what is the main action they take?* they gets main page 
- **Your Answer:** 
main page conttains:
-header tab: left (settings icon) right (search icon), in middle (mahfod logo)
-well come line ( salaamolikoum in arab and the name of user)
-a counter (total reps, memos, notes, revision, solidifying (we will clear up this in mahfod concept))
-4 main buttons : new memo, memo lib, revision, محكم (solidifyed)

---
*Save this file once you have added your answers, and let me know so I can read it!*

mahfod app concept:
mahfod uses spacing repetition to help studens memorise well, when user adds memo repetition session start immedatly, when he completes the number (can be edited in settings) revision session starts in the next day with less rep number (can be edited too) then its shows back every day for 30 day (can be edited too) if that 30 days are over the memo goes for an other showing system called solidifyfyying it shows back randomly but not too often to check if user still rember it (The SM-2 algorithm )