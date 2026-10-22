import type { Choice, Effect, Item, Scene } from '../../domain/story/types';
export function item(itemId: string, label: string, type: string, scene: string, material: Item['material'], options: Partial<Item> = {}): Item {
  return {itemId, label, type, sourceScene: scene, material, origin: 'new', unit: material === 'food' ? 'serving' : material === 'paper' && type === 'paper' ? 'sheet' : 'item', condition: material === 'food' ? 'edible' : 'used', destination: material === 'food' ? 'inventory' : 'pending', holder: 'player', singleUse: material !== 'food', reusable: false, retainable: false, carried: false, ...options};
}
const add = (id: string, label: string, type: string, scene: string, material: Item['material'], options: Partial<Item> = {}): Effect => ({type: 'acquire', item: item(id, label, type, scene, material, options)});
const change = (ids: string[], patch: Partial<Item>): Effect => ({type:'update', ids, patch});
const paper = (scene: string, count: number): Effect[] => Array.from({length:count}, (_, i) => add(`${scene}-paper-${i+1}`, `${scene === 'S05' ? 'Study notes' : 'Activity notice'} · sheet ${i+1}`, 'paper', scene, 'paper', {destination:'in_use', retainable:true}));
const food = (scene: string, id: string, label: string, destination: Item['destination']): Effect => add(id, label, 'food', scene, 'food', {destination,holder:destination==='food_discard'?'collection':'player'});
const choice = (id: string, label: string, description: string, aftermath: string, effects: Effect[] = [], requires?: string): Choice => ({id,label,description,aftermath,effects,requires});
const scene = (id: string, chapter: number, timeLabel: string, location: string, title: string, storyText: string, alt: string, choices: Choice[]): Scene => ({id,chapter,timeLabel,location,title,storyText,alt,choices});
export const CHAPTERS = ['A fresh start', 'Out on campus', 'On the way home', 'A little care'];
export const scenes: Scene[] = [
  scene('S01',1,'07:00','Student residence','First things first', 'Breakfast is ready. One serving is enough, and you can always come back for more.', 'The same student in a striped shirt sits at a breakfast table with toast, a toaster and a sunny window.', [
    choice('one','Start with one serving','Come back for more if needed.','One serving eaten. Nothing left over.',[food('S01','breakfast-1','Breakfast eaten','eaten')]),
    choice('extra','Take an extra serving','Eat one; leave the extra to be discarded.','The extra serving is discarded in this scene.',[food('S01','breakfast-1','Breakfast eaten','eaten'),food('S01','breakfast-extra','Uneaten extra breakfast','food_discard')]),
  ]),
  scene('S02',1,'07:35','By the front door','What goes in your bag?', 'Your clean cup, bottle, lunch kit and folding bag are by the door. Decide what to take for the day.', 'The student packs a backpack beside a door, with a cup, water bottle, lunch kit and folded bag on a bench.', [
    choice('all','Pack all four items','Cup, bottle, lunch kit and shopping bag.','All four are packed for later.',[{type:'pack',ids:['cup','bottle','kit','bag']}]),
    choice('drinks','Take my cup and bottle','Leave the lunch kit and shopping bag at home.','Your cup and water bottle are packed.',[{type:'pack',ids:['cup','bottle']}]),
    choice('none','Head out as I am','Leave the reusable items at home.','You head out with your backpack.',[{type:'pack',ids:[]}]),
  ]),
  scene('S03',1,'08:30','Campus coffee shop','The morning ritual', 'This café accepts clean reusable cups and has ceramic cups for drinking inside. Every option provides the same coffee.', 'A barista stands behind a coffee machine and counter, facing the student. Cups and café shelves fill the background.', [
    choice('own','Use my own cup','The café accepts it.','Your own cup is used; no new cup or lid.',[change(['cup'],{condition:'used'})],'cup'),
    choice('inside','Enjoy it in a café cup','Drink inside, then return the cup.','The ceramic cup is returned to the café.'),
    choice('takeaway','Get a takeaway cup','A disposable cup and lid to go.','One new cup and one lid need handling.',[add('coffee-cup','Takeaway coffee cup','cup','S03','paper'),add('coffee-lid','Coffee lid','lid','S03','plastic')]),
  ]),
  scene('S04',1,'10:00','Campus water station','Time for a drink', 'The drinking fountain works, and the refill tap is available. You can also buy water from the nearby machine.', 'An outdoor fountain and bottle refill tap stand beside a vending machine, with campus trees in the distance.', [
    choice('refill','Refill my bottle','Use the available refill tap.','Your existing bottle is refilled.',[change(['bottle'],{condition:'used'})],'bottle'),
    choice('fountain','Drink at the fountain','Get the water you need here.','You drink without acquiring a new bottle.'),
    choice('buy','Buy bottled water','Keep the empty bottle for tonight.','The empty water bottle goes into your bag.',[add('water-bottle','Single-use water bottle','bottle','S04','plastic')]),
  ]),
  scene('S05',2,'10:40','Library print room','Four pages to read', 'You need the same four pages for class. The digital copy is clear, and your class allows reading on a screen.', 'The student stands between a laptop and a printer, surrounded by library bookshelves and four document pages.', [
    choice('digital','Read the digital copy','All four pages are on screen.','No new paper is acquired.'),
    choice('double','Print on both sides','Four pages on two sheets.','Two sheets enter your day, still in use.',paper('S05',2)),
    choice('single','Print on one side','Four pages on four sheets.','Four sheets enter your day, still in use.',paper('S05',4)),
  ]),
  scene('S06',2,'12:00','Campus dining hall','Lunch, your way', 'The dining hall accepts a clean lunch kit. You can also use a returnable tray, or take a disposable box and fork.', 'A server offers lunch across a dining-hall counter; reusable trays, a lunch box and a fork are clearly visible.', [
    choice('own','Use my lunch kit','My clean box and cutlery.','Your lunch kit is now used, and remains yours.',[change(['kit'],{condition:'used'})],'kit'),
    choice('tray','Eat with a dining-hall tray','Return it when finished.','The tray and cutlery are returned.'),
    choice('disposable','Take a box and fork','Keep both used items for tonight.','A used lunch box and fork need handling.',[add('lunch-box','Disposable lunch box','box','S06','paper'),add('lunch-fork','Disposable fork','cutlery','S06','plastic')]),
  ]),
  scene('S07',2,'12:05','Lunch table','Just the right amount', 'It is the same lunch. One serving is enough today, and you are welcome to come back for more.', 'At a dining table, the student looks at a plate of lunch, with serving dishes and another student in the background.', [
    choice('one','Start with one serving','Come back if I am still hungry.','One serving eaten; nothing discarded.',[food('S07','lunch-1','Lunch eaten','eaten')]),
    choice('large','Take a large portion','Eat one serving; discard the extra.','The extra serving is explicitly discarded.',[food('S07','lunch-1','Lunch eaten','eaten'),food('S07','lunch-extra','Uneaten extra lunch','food_discard')]),
  ]),
  scene('S08',2,'14:00','Student club courtyard','Spread the word', 'Four classmates need the same activity information. All four can read digital messages, or share a printed notice.', 'The student and a club volunteer stand at a campus society table with a display board, bunting and a phone.', [
    choice('message','Send a group message','Reach all four classmates.','The four classmates receive the information.'),
    choice('poster','Make one shared notice','One sheet for everyone.','One shared notice is still in use.',paper('S08',1)),
    choice('flyers','Give everyone a flyer','Four separate sheets.','Four flyers are still in use.',paper('S08',4)),
  ]),
  scene('S09',3,'15:00','Campus snack counter','An afternoon pause', 'Each option gives you one suitable snack. The shared tray has hygienic tongs, and you can eat here.', 'A snack server stands by a tray of baked snacks and tongs, with wrapped snacks on a shelf and a nearby table.', [
    choice('plate','Eat here from a plate','Use the hygienic tongs.','The snack is eaten; the plate is returned.',[food('S09','snack','Afternoon snack eaten','eaten')]),
    choice('wrapped','Take a wrapped snack','One individual wrapper.','The snack is eaten; one wrapper remains.',[food('S09','snack','Afternoon snack eaten','eaten'),add('snack-wrapper','Snack wrapper','wrapper','S09','plastic')]),
    choice('bagged','Add a paper bag too','A wrapper plus one clean bag.','The snack is eaten; wrapper and bag remain.',[food('S09','snack','Afternoon snack eaten','eaten'),add('snack-wrapper','Snack wrapper','wrapper','S09','plastic'),add('snack-bag','Snack paper bag','bag','S09','paper',{retainable:true})]),
  ]),
  scene('S10',3,'17:00','Supermarket produce aisle','A tempting offer', 'You need one serving of fruit today. A promotion offers three. Any extra fruit will still be edible tonight.', 'In a supermarket produce aisle, the student faces fruit crates and a promotional display, with shelves behind.', [
    choice('one','Buy the one serving I need','Eat this fruit on the way home.','One fruit serving is bought for the way home.',[food('S10','fruit-1','Fruit for the way home','inventory')]),
    choice('three','Buy three in the promotion','Eat one later and keep two.','Three servings are bought; two are extra for later.',[food('S10','fruit-1','Fruit for the way home','inventory'),food('S10','fruit-2','Extra edible fruit 1','inventory'),food('S10','fruit-3','Extra edible fruit 2','inventory')]),
  ]),
  scene('S11',3,'17:05','Supermarket packing area','How to carry the fruit?', 'Keep the quantity you just chose. These options hold the same fruit; this model counts items, not lifecycle impacts.', 'The same supermarket fruit sits beside a paper produce bag and a tray with film; shelving continues behind the student.', [
    choice('loose','Keep the fruit loose','No produce packaging.','No new produce packaging is acquired.'),
    choice('paper','Use one paper produce bag','One clean packaging item.','One produce bag can be handled tonight.',[add('produce-bag','Paper produce bag','bag','S11','paper',{retainable:true})]),
    choice('tray','Use a tray with film','Two separate packaging items.','One tray and one film wrap need handling.',[add('fruit-tray','Fruit tray','tray','S11','plastic'),add('fruit-film','Fruit film wrap','film','S11','plastic')]),
  ]),
  scene('S12',3,'17:15','Supermarket checkout','At the checkout', 'Your fruit is small enough to carry by hand. The cashier can also provide a new bag. Your morning packing choice still matters.', 'A cashier faces the student across a checkout conveyor holding fruit, with a till, shopping bags and full supermarket shelves.', [
    choice('own','Use my folding bag','The same bag I packed this morning.','Your existing bag carries the shopping.',[change(['bag'],{condition:'used'})],'bag'),
    choice('hands','Carry the fruit by hand','This small purchase is manageable.','No new shopping bag is acquired.',[],'!bag'),
    choice('plastic','Get a new plastic bag','Keep it intact until tonight.','One new shopping bag enters your day.',[add('shopping-bag','Plastic shopping bag','bag','S12','plastic',{retainable:true})]),
    choice('paper','Get a new paper bag','Keep it intact until tonight.','One new shopping bag enters your day.',[add('shopping-bag','Paper shopping bag','bag','S12','paper',{retainable:true})]),
  ]),
  scene('S13',4,'18:30','Shared kitchen','Dinner for two', 'You ate one fruit serving on the way home. You and your housemate planned dinner together. There are enough edible ingredients here for two servings.', 'The student prepares food in a shared kitchen with a stove, fridge, vegetables and a table set for two.', [
    choice('cook','Cook the ingredients at home','Prepare the planned two servings.','One serving is eaten; one awaits your housemate.',[change(['fruit-1'],{destination:'eaten',label:'Fruit eaten on the way home'}),change(['ingredients-1','ingredients-2'],{destination:'prepared'}),food('S13','dinner-1','Dinner eaten','eaten'),food('S13','dinner-extra','Housemate dinner serving','inventory')]),
    choice('order','Order takeaway for two','Keep the home ingredients edible.','One serving is eaten; the extra and packaging remain.',[change(['fruit-1'],{destination:'eaten',label:'Fruit eaten on the way home'}),food('S13','dinner-1','Dinner eaten','eaten'),food('S13','dinner-extra','Housemate dinner serving','inventory'),add('dinner-box-1','Takeaway box 1','box','S13','plastic'),add('dinner-lid-1','Takeaway lid 1','lid','S13','plastic'),add('dinner-box-2','Takeaway box 2','box','S13','plastic'),add('dinner-lid-2','Takeaway lid 2','lid','S13','plastic')]),
  ]),
  scene('S14',4,'19:10','Dinner table','A change of plans', 'Your housemate cannot come home. One serving remains. It is safe to save, a clean container is available, and a friend is happy to receive it.', 'The student sees a message on a phone beside a spare dinner plate, a clean storage container and a shared kitchen table.', [
    choice('save','Save the extra serving','Use the clean container and suitable storage.','The food is saved, not counted as eaten.',[change(['dinner-extra'],{destination:'saved'})]),
    choice('share','Give it to my willing friend','Complete the handover tonight.','The friend receives one edible serving.',[change(['dinner-extra'],{destination:'transferred',holder:'recipient'})]),
    choice('discard','Discard the extra serving','One edible serving becomes food waste.','One dinner serving is explicitly discarded.',[change(['dinner-extra'],{destination:'food_discard',holder:'collection'})]),
  ]),
  scene('S15',4,'20:00','Student bedroom','A stitch in time', 'You still need this shirt. Its small open seam can be repaired with your sewing kit. A clothing exchange has confirmed it can accept it.', 'The student holds a shirt with a small loose seam, beside a sewing kit, a desk lamp, bookshelf and wardrobe.', [
    choice('repair','Mend it and keep wearing it','Use the sewing kit already here.','Your existing shirt is repaired and kept.',[change(['shirt'],{destination:'repaired',condition:'clean'})]),
    choice('exchange','Hand it to the confirmed exchange','Complete the agreed handover.','The confirmed project receives the shirt.',[change(['shirt'],{destination:'transferred',holder:'recipient'})]),
    choice('discard','Discard the shirt','The damaged shirt leaves use.','Your existing shirt goes to general collection.',[change(['shirt'],{destination:'general',holder:'collection'})]),
  ]),
  scene('S16',4,'21:30','Back home','A place for everything', 'Sort today’s remaining items and your old notebook. Keep only suitable clean paper and intact bags. Other reusables are washed and stay yours. Collection rules here are illustrative.', 'The student sorts the actual papers and bags from the day beside an old notebook, reusable items and labelled collection containers.', [
    choice('keep','Keep usable items; sort the rest','Retain suitable paper, bags and notebook.','Usable items remain; the rest enters collection.',[{type:'tidy',mode:'keep'}]),
    choice('separate','Send items to material collections','Include usable paper, bags and notebook.','Collection is disposal too; it does not erase waste.',[{type:'tidy',mode:'separate'}]),
    choice('mixed','Put these items in general collection','Reusable cup, bottle and kit stay yours.','The eligible items go to general collection.',[{type:'tidy',mode:'mixed'}]),
  ]),
];
export const initialInventory: Item[] = [
  ...[['cup','Reusable cup'],['bottle','Water bottle'],['kit','Lunch box and cutlery'],['bag','Folding shopping bag']].map(([id,label]) => item(id,label,'reusable','initial','durable',{origin:'existing',singleUse:false,reusable:true,condition:'clean',destination:'retained'})),
  item('notebook','Old notebook','notebook','initial','paper',{origin:'existing',singleUse:false,retainable:true,condition:'clean',destination:'in_use'}),
  item('shirt','Existing shirt','clothing','initial','textile',{origin:'existing',singleUse:false,condition:'damaged',destination:'in_use'}),
  item('ingredients-1','Home ingredients · serving 1','ingredient','initial','food',{origin:'existing'}),
  item('ingredients-2','Home ingredients · serving 2','ingredient','initial','food',{origin:'existing'}),
];
