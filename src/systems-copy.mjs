export const SYSTEM_COPY = {
  'ai-receptionist': {
    problem: `
<p>Picture a Tuesday morning when you are already with a customer and the shop line rings. You cannot pick up. The caller hears a greeting you recorded years ago, leaves a short voicemail, and goes back to looking for someone who can take the job today. By the time you listen, the work has often moved on.</p>
<p>An AI receptionist is the person who stays by that phone. It speaks in your business name, uses the greeting you approved, and answers from the facts you gave it. It is not a generic robot reading a script from another industry. The words are yours. The hours it covers are the hours you choose.</p>
<p>Owners tell us the same scene. They are on a roof, under a truck, in a kitchen, or driving between jobs. The phone is in a pocket. A missed call is not a small annoyance. It is a person who was ready to book and then called the next name. The receptionist exists so that moment does not depend on you being free.</p>`,
    rest: `
<h2>What you can change</h2>
<h3>Adjustable</h3>
<p>Change the greeting, the answers, the booking rules, and the hours without waiting on a rebuild. If you stop taking a kind of job, say so and the next call follows the new rule.</p>
<h3>Fixable</h3>
<p>If a call fails to connect or a summary does not arrive, the failure raises an alert to Thomas. You are not left guessing why the phone went quiet.</p>
<h3>Flexible</h3>
<p>Some businesses want every caller offered a time. Some want a message and a callback from a person. The path bends around the way you already decide.</p>
<h3>Customizable</h3>
<p>Your services, your service area, and the questions you ask a caller are written for your shop. Shelf menus from another trade stay out of it.</p>
<h2>When something goes wrong</h2>
<p>If the voice system is unsure, the call comes to you. If a transfer fails, the caller can leave a message and you still get the summary by text or email. The fallback is a person, not a dead end.</p>
<h2>What it connects to</h2>
<p>The receptionist can sit with Google Workspace and Gmail for the summary, Twilio for the phone path, ElevenLabs for the voice, n8n for the handoff, and Cloudflare in front of the site that feeds it. You do not have to live in ten tabs to hear what happened.</p>
<h2>Fits at stage</h2>
<p>This is a Start system. It still matters when you have a crew, because the phone should not follow you up a ladder. At Scale it keeps one front door for more than one crew.</p>
<h2>Questions</h2>
<h3>Will it invent answers?</h3>
<p>No. It uses the answers you approved. Anything outside that list comes to you.</p>
<h3>Can I hear what it said?</h3>
<p>Yes. You get a summary by text or email after the call.</p>
<h3>Do I have to be technical?</h3>
<p>No. You approve the words. We set the path.</p>
<p>A plumber on a crawlspace job does not need a second pair of hands on the phone. The receptionist takes the greeting you wrote, offers the times you allow, and sends you a short note: who called, what they needed, and whether a time was booked. If the caller asks for a job you do not do, the note says so and the caller is not promised a visit. That is the whole product. It is adjustable when your season changes, fixable when a carrier hiccup drops a call, flexible when you want messages instead of bookings on Fridays, and custom to the way you already talk to customers. The Goldie slot on this page is where our own receptionist will sit later. Until then, call or text Thomas and the same phone number on this site reaches a person.</p>
<p>Think through a single afternoon. At 2 the line rings while you are writing a measurement. The receptionist answers, asks the address and the problem, and books a window you marked open. At 2:10 you feel the phone buzz with the summary. You finish the measurement. You do not play voicemail in the truck at 7. That is time returned to the job you were already paid to do, and it is a caller who did not have to try the next company. The system does not claim it catches every human situation. It claims a clear path: answer, book or message, summarize, and hand you the unsure ones.</p>`,
  },
  'speed-to-lead': {
    problem: `
<p>A lead is a person who raised a hand. They filled a form, tapped an ad, or asked for a quote. Then they wait. If nobody calls, the hand goes down and the person calls a competitor who did answer. Speed-to-lead is the path that runs after that hand goes up, whether you are free or not.</p>
<p>The order is deliberate. A call comes first, because a voice still settles more jobs than a silent inbox. If nobody answers, a text goes out. If the text sits, an email follows. You receive the lead and a record of what was said, so you are not reconstructing the conversation from memory at night.</p>
<p>This is follow-up, not a promise that every lead becomes a job. Some people were curious. Some were comparing. The system makes sure the curious ones hear from you while they still remember filling the form.</p>`,
    rest: `
<h2>What you can change</h2>
<h3>Adjustable</h3>
<p>The words in the text, the delay before the email, and which leads count as worth a call are rules you can edit. A winter slowdown and a summer rush do not have to share one script.</p>
<h3>Fixable</h3>
<p>If the call step fails, the text still goes. If the text fails, the email still goes. Each break raises a flag instead of vanishing.</p>
<h3>Flexible</h3>
<p>A form on your site, a lead from an ad, or a name you type in can enter the same path. The source can differ. The follow-up shape stays one you recognize.</p>
<h3>Customizable</h3>
<p>Your offer, your tone, and the questions you want answered are written for your trade. A mover and a coach should not sound like the same company.</p>
<h2>When something goes wrong</h2>
<p>The fallback is the next channel. Call, then text, then email. You still get the lead even when the customer never picks up. Thomas gets an alert when a step itself breaks.</p>
<h2>What it connects to</h2>
<p>Forms land through the site on Cloudflare. Gmail carries the email step. Twilio carries call and text. n8n runs the order. Google Workspace holds the record you read later.</p>
<h2>Fits at stage</h2>
<p>Start here if you are the only one answering. Keep it when a crew is busy on jobs, because the lead should not wait for the crew to drive back.</p>
<h2>Questions</h2>
<h3>Does it text people who did not ask?</h3>
<p>It follows up the person who asked. Consent for later texts is a separate checkbox on our own forms, and it starts unchecked.</p>
<h3>Will I see the conversation?</h3>
<p>Yes. You get the lead and what was said.</p>
<h3>Can I turn a channel off?</h3>
<p>Yes. If you want calls only, or texts only after a certain hour, that is a rule change.</p>
<p>Walk a lead named only by the form they filled. They asked for a haul on a Wednesday. The system calls. They are in a meeting, so the text arrives with a simple question and your number. They reply after lunch. You see the reply and the original request together, not as a mystery thread. If they never reply, the email still gives them a way back, and you are not left wondering whether anyone tried. That sequence is the product. Adjust the wording when your offer changes. Fix the path when a carrier rejects a number. Bend it around the tools you already pay for. Keep it specific to the jobs you want, so a tire question and a full move do not get the same speech.</p>
<p>Owners lose leads in the gap between "we will call them back" and the moment someone is free. The gap is where the other company wins. Speed-to-lead closes the gap with a fixed order you can explain to a new hire in one minute: call, text, email, then show me the record. No one on the crew has to remember the order. The order is the system.</p>`,
  },
  websites: {
    problem: `
<p>A website is not a brochure you hope someone finishes. For a service business it is the front counter that is open when you are not. The visitor is on a phone, often at night, often comparing two or three companies. They need the offer, a way to call, a way to text, and a form that reaches you.</p>
<p>Most lost jobs on a site are boring. The phone number is an image. The form says it sent and then nothing arrives. The first screen talks about the company instead of the job the visitor wants done. We build the opposite: the offer above the fold, click to call and click to text on every page, a form tested from the button to the place you read leads, and search basics on every page.</p>
<p>Search basics means a clear title, a description, a name, a place, and a page the visitor can understand. It is not a trick. It is the floor.</p>`,
    rest: `
<h2>What you can change</h2>
<p>The offer line, the services you list, the towns you name, and the questions on the form can change when the business changes. A page is not sealed.</p>
<h3>Adjustable</h3>
<p>Swap a headline, a service, or a question without a new project. Seasonal work can come forward and step back.</p>
<h3>Fixable</h3>
<p>If a form stops reaching you, that is a broken path, not a mystery. We test the path before launch and again when something in the chain changes.</p>
<h3>Flexible</h3>
<p>Some owners want the form to prepare a text the visitor sends. Some want it to post to a backend once that backend is proven. The page can do either. It should never pretend a message was delivered.</p>
<h3>Customizable</h3>
<p>The structure is proven. The words, colors, and the one signature move are for your business. A coach's site and a mechanic's site should not be the same costume.</p>
<h2>When something goes wrong</h2>
<p>If the automatic send is down, the visitor still has call and text on the page. A failed form keeps what they typed and offers another way to reach you. Silence is the failure we design against.</p>
<h2>What it connects to</h2>
<p>The public site is served from GitHub. Cloudflare can sit in front of a form endpoint when you are ready for one. Gmail and Google Workspace are where many owners already read. The site does not require you to learn a new inbox.</p>
<h2>Fits at stage</h2>
<p>A website belongs at Start, next to the receptionist and follow-up. It stays at Grow and Scale as the public door for more crews.</p>
<h2>Questions</h2>
<h3>Do I need new photos first?</h3>
<p>No. A page can launch on type, color, and a real offer. Photos can come later and should be yours.</p>
<h3>Will the page make claims I did not approve?</h3>
<p>No. The sentences on the page come from what you and we have confirmed. If a number is not confirmed, it stays off the page.</p>
<h3>Can the form be tested?</h3>
<p>Yes. Before launch we run the path and confirm the lead lands where you read it.</p>
<p>A visitor at 9 at night is deciding with a thumb. They see the job you do, they tap call, or they text, or they leave a name and number. If they leave the form, you should be able to answer what they asked. That is a higher bar than a pretty header. We hold the page to it. The same page can explain how you work, show the area you cover, and give a next step that is a free audit or a call, without burying the step under a paragraph of company history.</p>
<p>When the business adds a service, the page should be able to say so the same week. When a form field is wrong, it should be editable. When you hate a sentence, it should be replaceable. Adjustable, fixable, flexible, customizable applies to the site the same way it applies to a voice system. The site is a system. It is not a poster.</p>`,
  },
  booking: {
    problem: `
<p>Double booking is how a good week turns into two angry customers. Someone on the phone offers Thursday at 10. Someone on the website takes Thursday at 10. Both people show up. Online booking only helps if the slot is checked again at the moment of confirmation, not only when the calendar was pretty an hour ago.</p>
<p>The path is short. The customer sees open times. They pick one. The system checks that the time is still open. It confirms. It reminds. The appointment shows on your calendar. You are not retyping it from a text message into a paper book.</p>
<p>Reminders exist so the truck roll is not a no-show. The reminder is a message, not a new promise. If you need a person to approve odd jobs before they hit the calendar, that approval can sit in front of the confirm step.</p>`,
    rest: `
<h2>What you can change</h2>
<h3>Adjustable</h3>
<p>Window length, how far ahead someone can book, which days are open, and how much gap you want between jobs are settings. Change them when the season changes.</p>
<h3>Fixable</h3>
<p>If a confirmation fails, the customer should not be told they are booked. The failure flags Thomas and the slot is not silently taken twice.</p>
<h3>Flexible</h3>
<p>A one-person shop and a crew with a shared calendar can use the same idea. The calendar behind it can be the Google Calendar you already run.</p>
<h3>Customizable</h3>
<p>The jobs you allow online, the questions you ask, and the words in the confirmation are written for your work. A mobile mechanic and a coach do not offer the same slots.</p>
<h2>When something goes wrong</h2>
<p>The check before confirm is the guard. If that check cannot reach the calendar, the booking stops and a person hears about it. A reminder that fails does not erase the appointment. You still see it on the calendar.</p>
<h2>What it connects to</h2>
<p>Google Calendar holds the day. Gmail can carry the confirmation. Twilio can carry a reminder text when you want one. n8n connects the steps. Google Workspace is the home base most owners already open.</p>
<h2>Fits at stage</h2>
<p>Booking shows up at Grow, when more than one person can be promised a time. A solo owner can still use it, and it becomes necessary once a crew can collide.</p>
<h2>Questions</h2>
<h3>Can customers book a time I wanted to keep?</h3>
<p>Only times you mark open are offered. You can pull a day back.</p>
<h3>What if two people click the same minute?</h3>
<p>The second check sees the slot taken. One of them is asked to pick again.</p>
<h3>Do I have to approve every booking?</h3>
<p>You can. Some shops auto-confirm standard jobs and hold unusual ones for a person.</p>
<p>Think of a Thursday with three techs. The calendar is the truth. The website is a window onto the open parts of that truth. A customer in Belgrade picks 10. The system asks the calendar again. It is still open, so the confirmation goes out and the block appears where the crew will see it. Another customer tapping 10 a minute later gets a different choice. Nobody drives across town to find the bay full. That is the point of the second check. Adjust the gaps when jobs start running long. Fix the connection when the calendar account needs a new permission. Bend the questions around the details your crew needs before they roll. Keep the words in your voice so the reminder sounds like you, not like a hotel.</p>
<p>Paper books fail in a specific way: two people write in them. A shared online book fails in a specific way too, if the website and the book are not the same book. This system makes them the same book.</p>
<p>A Saturday in season shows the difference. The phone rings while you are under a car, and the website is still offering times. Without a live check, the website and the phone become two desks. With the check, the website is the same desk. You set how many jobs a day can hold, which services can be picked without a conversation, and which services stop and ask you first. A coach booking a session and a shop booking a repair can both use the pattern, because the pattern is a slot, a second look, and a confirmation. The reminder goes out on the channel you chose. If the customer needs to move the time, they pick from what is still open, and the old block comes off the calendar so it can be offered again.</p>`
  },
  'job-to-invoice': {
    problem: `
<p>The job is not done when the work is done. It is done when the time, the parts, and the invoice agree. Most owners close that loop at the kitchen table. The parts ticket is in the truck. The hours are a guess. The invoice goes out tomorrow, which becomes next week.</p>
<p>Job to invoice puts that loop on the phone you already have in your hand at the driveway. Clock in when you arrive. Log parts and receipts while the hood is open. Close the job when you leave. The invoice is drafted from what you logged. You approve it. Then it sends. A draft is not a bill until you say so.</p>
<p>That approval is the point. The system prepares. A person sends. Money does not move because a screen guessed.</p>`,
    rest: `
<h2>What you can change</h2>
<h3>Adjustable</h3>
<p>The fields on the close-out, the way labor is described, and who is allowed to approve can change as the crew grows. A new part category should not require a new app.</p>
<h3>Fixable</h3>
<p>If a draft fails to save, the notes should still be on the phone and the failure should flag a person. A lost close-out is the bug we treat as urgent.</p>
<h3>Flexible</h3>
<p>Some crews want receipts photographed. Some want a short list of parts. The close-out bends around the way the tech already works in a driveway.</p>
<h3>Customizable</h3>
<p>Your job types, your labor lines, and the note the customer sees are written for your shop. Stripe can connect when you want a card payment on an invoice you have already approved.</p>
<h2>When something goes wrong</h2>
<p>If the phone is offline in a parking lot, the close-out stays on the device until it can sync. If a sync fails, you still have the draft and Thomas gets the alert. The customer is not billed from a half-saved job.</p>
<h2>What it connects to</h2>
<p>Google Workspace and Gmail can carry the invoice you approved. The phone app holds the clock and the parts. Cloudflare can host the sync. Stripe can connect for payment after approval. GitHub holds the app itself. n8n can notify you when a draft is waiting.</p>
<h2>Fits at stage</h2>
<p>This belongs at Grow, when jobs are leaving the driveway faster than invoices are leaving the kitchen. At Scale it is how more than one crew closes the same way.</p>
<h2>Questions</h2>
<h3>Does the customer get a bill without me?</h3>
<p>No. You approve, then it sends.</p>
<h3>What if I forget a part?</h3>
<p>Open the job and add it before you approve. The draft can be edited.</p>
<h3>Can two techs log the same job?</h3>
<p>The job has one record. People add lines to it instead of keeping private notes.</p>
<p>Follow one brake job. You arrive and clock in. The pad set and the rotor go on the record while you are still in the driveway, with a photo of the receipt if you want it. You close the job. A draft invoice is waiting before you start the truck. You look at it in the cab, fix a line, and approve. The customer gets the bill while the work is fresh, and you are not rebuilding the ticket from memory after dinner. That is the product. Adjust the lines when you change how you describe labor. Fix the sync when a phone cannot reach the server. Bend the photos and fields around dirty hands and cold weather. Keep the approval in a human hand so a wrong part never becomes a wrong bill on its own.</p>
<p>The comfort owners want is not a fantasy that nothing can be mistyped. It is a loop short enough that the mistake is caught before the customer sees it. Clock, log, close, draft, approve. Five words a new tech can learn on day one.</p>
<p>The driveway is a bad office and a good place to capture facts. The part number is on the box in your hand. The time started when you pulled in. Waiting until night means both facts get softer. The phone record keeps the hard version. You can add a note the customer said at the bumper. You can mark a job that needs a second visit. You can see yesterday's open drafts before the first call of the morning. When a second tech joins, they close their own lines into the same record, so the invoice is one story instead of two texts you have to merge.</p>`
  },
  documents: {
    problem: `
<p>Paperwork piles up in the seat, the office, and the camera roll. Agreements get signed on a hood with a wet pen. Two people leave with different copies. A month later nobody can find the version that was signed.</p>
<p>Document systems do two jobs. First, a pile can become a draft: drop in the paperwork, let AI prepare the record, and have a person approve it before it is treated as final. Second, an agreement can be sent, signed on a phone, and stored so both sides keep the same signed PDF with an audit trail.</p>
<p>The person in the middle is not optional. Drafts stay drafts until someone who knows the job says they are right. That is how errors leave the process without anyone pretending the software is perfect.</p>`,
    rest: `
<h2>What you can change</h2>
<h3>Adjustable</h3>
<p>The template, the fields a signer fills, and the order of who signs can change when the agreement changes. You should not be stuck with last year's form.</p>
<h3>Fixable</h3>
<p>If a signature link fails or a file does not save, the alert goes to a person. The customer is not told the document is finished when it is not.</p>
<h3>Flexible</h3>
<p>A one-page service agreement and a longer packet can use the same idea: draft, approve, send, sign, keep one PDF. The length can differ.</p>
<h3>Customizable</h3>
<p>Your clauses, your name, and your logo belong on the document. The trail of who signed and when belongs to that document, not to a generic folder.</p>
<h2>When something goes wrong</h2>
<p>If a signer stops halfway, the document stays unfinished and you can see that. If email delivery fails, you still have the record and a way to send the link again. Nothing is marked finished until the required people have signed.</p>
<h2>What it connects to</h2>
<p>Google Workspace and Gmail can deliver the link and the finished PDF. Cloudflare and GitHub carry the app. The signed file is the thing both sides keep, so you are not hunting through a camera roll.</p>
<h2>Fits at stage</h2>
<p>Documents show up at Scale, when the pile is no longer something one owner can hold in their head. Crews and locations make a shared trail matter.</p>
<h2>Questions</h2>
<h3>Who approves the draft?</h3>
<p>A person. The software prepares. It does not declare the record final.</p>
<h3>Do both sides get the same file?</h3>
<p>Yes. The signed PDF and the audit trail go to both.</p>
<h3>Can I change a form later?</h3>
<p>Yes. A new version can go out. Old signed copies stay as they were signed.</p>
<p>Imagine the packet that rides in the truck all week. Intake sheets, a service agreement, a photo of a permit. Instead of retyping them on Sunday, you drop them in. A draft comes back in your language, with the blanks still blank where the page was unreadable. You correct two lines and approve. When a customer needs to sign, they do it on their phone, and you both keep the PDF. The trail says who signed and when. That is the product. Adjust the template when your terms change. Fix the delivery when a link expires. Bend the fields around the way your crew already fills out paper. Keep a human approval on anything that states a fact about the job.</p>
<p>Owners fear paperwork because it hides mistakes until a dispute. A short loop, with a person at the approval, pulls the mistake forward to a moment when it is cheap to fix.</p>
<p>A signed agreement is a memory both people can open. The audit trail is the list of what happened to that file: who opened the link, who signed, and when the PDF was stored. If a customer calls three months later and says the terms were different, you open the PDF you both kept, not a photo of a clipboard. New hires can send the current form without asking you to find it. Old forms stay attached to the jobs that used them, so a change next month does not rewrite last month. The drop-in pile is separate from the signature path. A messy intake photo becomes a draft you correct. A signature request starts from a form you already approved. Mixing those two jobs is how a half-read scan becomes a contract. They stay distinct on purpose.</p>`
  },
  'team-apps': {
    problem: `
<p>A crew does not fail from lack of effort. It fails when a new hire's first week is a verbal tour, when clock-in is a text that says "I'm here," and when the shift sheet lives on one person's clipboard. The owner becomes the memory of the company.</p>
<p>Team apps put the day on a phone. Clock in with a photo so the start of the job is a fact. Give a new hire a first-week checklist so the same steps happen every time. Use shift check sheets so the close of a shift is the same list. Send the reports to your inbox so you are not chasing screenshots.</p>
<p>The apps are for the people doing the work, with big taps and few steps. A tool that needs a tutorial in the driveway will not be used. The checklist has to be obvious on a cold morning.</p>`,
    rest: `
<h2>What you can change</h2>
<h3>Adjustable</h3>
<p>The checklist items, the shift questions, and who receives the report can change when you learn what the crew skips. A bad question should be editable the same day.</p>
<h3>Fixable</h3>
<p>If a clock-in fails to save, the person should see that, and you should get a flag. A missing punch is a problem to repair, not a silent gap in the week.</p>
<h3>Flexible</h3>
<p>A two-person crew and a weekend event staff can use the same pattern. The list of tasks changes. The habit of checking them does not.</p>
<h3>Customizable</h3>
<p>Your shop name, your steps, and your wording belong on the list. A first week in a garage is not a first week on an event crew, and the app should not pretend it is.</p>
<h2>When something goes wrong</h2>
<p>If the phone cannot reach the server, the checklist can stay on the device until it syncs. If a report email fails, the answers are still in the record and the failure is flagged. People are not asked to redo a whole shift because one message bounced.</p>
<h2>What it connects to</h2>
<p>Gmail and Google Workspace receive the reports. Cloudflare can host the app. GitHub holds the code. The crew does not need a new login philosophy. They need a list and a clock.</p>
<h2>Fits at stage</h2>
<p>Team apps arrive at Grow, when you are no longer the only one who knows the opening routine. At Scale they keep a second crew on the same routine.</p>
<h2>Questions</h2>
<h3>Will a new hire know what to tap?</h3>
<p>The first-week list is the teacher. Each step is a line they can finish.</p>
<h3>Can I see who clocked in?</h3>
<p>Yes. The photo and the time are the record.</p>
<h3>Can I add a step after a mistake?</h3>
<p>Yes. The list is adjustable. Add the step once and the next shift includes it.</p>
<p>Monday for a new hire used to be you, talking, while a job waited. Now the phone says: meet the crew, learn the truck, photograph the first clock-in, finish the safety lines, send the questions you still have. You still introduce yourself. You are not the only copy of the routine. At the end of the shift the check sheet asks what was left undone. The report hits your inbox. You fix tomorrow's list if today's list was wrong. That is the product. Adjust the lines when the work teaches you something. Fix a save that fails on a weak signal. Bend the photos and the words around gloves and short breaks. Keep the list specific to your crew so nobody is tapping through someone else's job.</p>
<p>The owner who wants scale without friction is asking for a day that does not depend on their memory. The app is that memory, written down, checked, and sent back.</p>
<p>The report in your inbox is the close of the loop. It names the shift, the person, and the lines left open. You do not scroll a group text to learn that the truck was low on oil. You add the oil check to tomorrow's list if it was missing today. A weekend crew and a weekday crew can carry different lists and still clock in the same way. The photo shows the person was at the job when the clock started, which matters when a customer asks what time you arrived. If a phone dies mid-shift, the saved lines are the ones that already synced, and the rest wait on the device until it has a signal again. You are told. The crew does not lose the whole day because a battery died.</p>`
  },
  'ai-operations': {
    problem: `
<p>A growing shop collects tools the way a truck collects sockets. One tab for the calendar, one for mail, one for the leads, one for the invoices, one for the notes, and a group text that contradicts all of them. AI operations is the work of making those tools one system, with an assistant that knows your business and a screen where the numbers sit together.</p>
<p>It starts with a map. How does a lead become a job, a job become an invoice, an invoice become a paid week? Where do people retype the same name? Where does a failure go unnoticed? Then the tools you already use get connected. Then an assistant is built on your answers, not on a generic company. Then the numbers you care about land on one screen. Then every failure raises an alert.</p>
<p>This is the Scale system. It assumes the front door, the follow-up, and the crew tools exist or are being built. It is how they stop being separate projects.</p>`,
    rest: `
<h2>What you can change</h2>
<h3>Adjustable</h3>
<p>The questions the assistant may answer, the numbers on the screen, and the alerts you want can change when the business changes. A dashboard that cannot be edited becomes another tab you ignore.</p>
<h3>Fixable</h3>
<p>The standard is that a failure raises a flag. A workflow that dies quietly is the defect. Thomas gets the alert, and the path can be repaired without you discovering it from a customer.</p>
<h3>Flexible</h3>
<p>Your stack is allowed to be the stack you have. The map starts from Google Workspace, the calendar, the mail, the phone, and the site. It does not begin by throwing those out.</p>
<h3>Customizable</h3>
<p>The assistant knows your services, your rules, and your words. A screen for a one-crew shop and a screen for two locations should not be copies of each other.</p>
<h2>When something goes wrong</h2>
<p>Alerts are the design, not an apology. If a step fails, a person hears about it. If the assistant is unsure, it does not invent a fact. The unsure item comes to you, the same way an unsure phone call does.</p>
<h2>What it connects to</h2>
<p>Google Workspace, Google Calendar, Gmail, Twilio, ElevenLabs, n8n, Cloudflare, and GitHub are the tools this system is built to join. The join is the work. A new tool gets added when it earns a place on the map, not because it is fashionable.</p>
<h2>Fits at stage</h2>
<p>Scale. You have crews or locations, and the cost of ten tabs is now higher than the cost of one map. Start and Grow build the pieces. This is where the pieces become an operation.</p>
<h2>Questions</h2>
<h3>Do I have to move all my tools?</h3>
<p>No. We connect what you use. A move happens only when a tool is in the way.</p>
<h3>Will the assistant guess?</h3>
<p>It answers from what you approved. Unsure items come to a person.</p>
<h3>What numbers show up?</h3>
<p>The ones you choose to watch. A number we have not confirmed does not get printed as a fact.</p>
<p>An owner with two crews described the week as "I open mail, then the calendar, then the texts, then I forget which lead I already called." The map for that shop was simple: a lead has one record, a job has one calendar block, a close-out has one draft, and a failure sends one alert. The assistant on top of that map can answer "what is open tomorrow" from the calendar, not from a guess. The screen shows the leads waiting, the jobs booked, and the drafts that still need approval. That is the product. Adjust the screen when a number stops mattering. Fix the alert when it fires too often or not at all. Bend the connections around the tools you will not give up. Keep the assistant on your facts so it sounds like your operation and not like a brochure.</p>
<p>Fewer mistakes, in this sense, is not a claim that the week will be perfect. It is a design: type a fact once, check before you act, flag the failure, and leave a person where money or a promise is involved. The map makes that design visible. The assistant and the screen keep it in daily use.</p>`,
  },
};
