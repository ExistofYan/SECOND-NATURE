export const probeSets={
 A:[{id:'A1',text:'A clean shopping bag is still useful. Is keeping it for reuse the same as sending it to recycling now?',answers:['Yes, they are the same action.','No. Keeping it extends its use before collection.'],correct:1},{id:'A2',text:'You bought extra fruit that is still edible at the end of the day. What should the record show?',answers:['Edible inventory, not food waste yet.','Food waste as soon as it is bought.'],correct:0},{id:'A3',text:'A bottle goes into a recycling collection. Does the number of discarded bottles become zero?',answers:['Yes, recycling cancels the discarded item.','No, it is still a discarded item in collection.'],correct:1}],
 B:[{id:'B1',text:'An intact folder can be used next term. How is keeping it different from recycling it today?',answers:['Keeping extends use; recycling sends it to collection.','Both mean the folder was discarded today.'],correct:0},{id:'B2',text:'One dinner portion is safely stored for tomorrow. What is its status tonight?',answers:['Already eaten.','Saved for later, not food waste tonight.'],correct:1},{id:'B3',text:'You acquire two disposable cups and send both to recycling collection. How many cups were acquired?',answers:['Two, even though they entered recycling collection.','Zero, because recycling removed them from the count.'],correct:0}],
};
export const RATING_INSTRUMENT_VERSION='waste-ui-1';
export const ratingSections=[
 {key:'waste',title:'Waste prevention',description:'Think about your understanding and intentions after playing. There are no right or wrong ratings.'},
 {key:'interface',title:'Interface experience',description:'Think about how the game felt to use, including any difficulties.'},
] as const;
export interface RatingQuestion {
 key:string; section:typeof ratingSections[number]['key']; title:string; low:string; high:string;
 labels:string[]; highMeaning:string; context?:string;
}
const understanding=['Not at all clear','Slightly clear','Moderately clear','Very clear','Extremely clear'];
const likelihood=['Very unlikely','Unlikely','Neither likely nor unlikely','Likely','Very likely'];
export const ratingQuestions:RatingQuestion[]=[
 {key:'singleUseUnderstanding',section:'waste',title:'How clear are you about which everyday choices create single-use waste?',low:understanding[0],high:understanding[4],labels:understanding,highMeaning:'Greater self-reported understanding'},
 {key:'foodWasteUnderstanding',section:'waste',title:'How clear are you about ways to avoid wasting edible food?',low:understanding[0],high:understanding[4],labels:understanding,highMeaning:'Greater self-reported understanding'},
 {key:'preventionUnderstanding',section:'waste',title:'How clear is the difference between preventing waste and recycling it?',low:understanding[0],high:understanding[4],labels:understanding,highMeaning:'Greater self-reported understanding'},
 {key:'consequenceUnderstanding',section:'waste',title:'How clear was the link between your choices and the waste recorded in the story?',low:'Not clear',high:'Very clear',labels:['Not clear','Slightly clear','Moderately clear','Clear','Very clear'],highMeaning:'Greater perceived clarity of waste consequences'},
 {key:'wasteConfidence',section:'waste',title:'How confident are you in choosing a way to reduce waste in your daily routine?',low:'Not confident',high:'Extremely confident',labels:['Not confident','Slightly confident','Moderately confident','Very confident','Extremely confident'],highMeaning:'Greater self-reported confidence'},
 {key:'dailyRelevance',section:'waste',title:'How relevant were the waste-related situations to your student life?',low:'Not relevant',high:'Extremely relevant',labels:['Not relevant','Slightly relevant','Moderately relevant','Very relevant','Extremely relevant'],highMeaning:'Greater perceived relevance'},
 {key:'reuseIntention',section:'waste',title:'How likely are you to bring a reusable item when you next need one?',low:likelihood[0],high:likelihood[4],labels:likelihood,highMeaning:'Stronger stated reuse intention',context:'For example, a cup, bottle, container or shopping bag. Rate your current intention, even if this is already a habit.'},
 {key:'foodPlanningIntention',section:'waste',title:'How likely are you to plan your next meal portion to avoid leftovers?',low:likelihood[0],high:likelihood[4],labels:likelihood,highMeaning:'Stronger stated food-planning intention'},
 {key:'ease',section:'interface',title:'How easy was it to choose with your hand?',low:'Very difficult',high:'Very easy',labels:['Very difficult','Difficult','Neither easy nor difficult','Easy','Very easy'],highMeaning:'Greater ease'},
 {key:'responsiveness',section:'interface',title:'How responsive did the cursor feel when you moved your hand?',low:'Very unresponsive',high:'Very responsive',labels:['Very unresponsive','Unresponsive','Neither responsive nor unresponsive','Responsive','Very responsive'],highMeaning:'Greater perceived responsiveness'},
 {key:'selectionAccuracy',section:'interface',title:'How often did the game select the option you intended?',low:'Never',high:'Always',labels:['Never','Rarely','Sometimes','Often','Always'],highMeaning:'Greater self-reported selection accuracy'},
 {key:'feedback',section:'interface',title:'How clear was the feedback that your pinch had selected an option?',low:'Not clear',high:'Very clear',labels:['Not clear','Slightly clear','Moderately clear','Clear','Very clear'],highMeaning:'Greater perceived selection-feedback clarity'},
 {key:'fatigue',section:'interface',title:'How tired does your arm feel?',low:'Not tired',high:'Very tired',labels:['Not tired','A little tired','Moderately tired','Tired','Very tired'],highMeaning:'More arm fatigue'},
 {key:'coherence',section:'interface',title:'How connected did the story feel?',low:'Not connected',high:'Very connected',labels:['Not connected','Slightly connected','Moderately connected','Connected','Very connected'],highMeaning:'Greater perceived story connection'},
 {key:'clarity',section:'interface',title:'How clear were the end-of-day outcomes?',low:'Not clear',high:'Very clear',labels:['Not clear','Slightly clear','Moderately clear','Clear','Very clear'],highMeaning:'Greater perceived outcome clarity',context:'Think about the outcomes shown after your choices in the story.'},
 {key:'engagement',section:'interface',title:'How engaging was the experience of playing the story?',low:'Not engaging',high:'Extremely engaging',labels:['Not engaging','Slightly engaging','Moderately engaging','Very engaging','Extremely engaging'],highMeaning:'Greater self-reported engagement'},
];
export function isRatingValue(value:unknown):value is number {
 return typeof value==='number'&&Number.isInteger(value)&&value>=1&&value<=5;
}
