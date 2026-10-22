"""Replay exported item events. Standard library only. No invented study data."""
import sys
import json
import csv
import statistics
from collections import defaultdict

def replay(session):
    items = {i['itemId']: dict(i) for i in session['initialInventory']}
    for event in session['events']:
        if event['type'].startswith('item_') and 'item' in event['payload']:
            i = event['payload']['item']
            items[i['itemId']] = dict(i)
    return list(items.values())

def analyze(session):
    items = replay(session)
    non_food = [i for i in items if i['material'] != 'food']
    food = [i for i in items if i['material'] == 'food']
    waste = [i for i in non_food if i['destination'] in ('general', 'recycling')]
    by_type = {}
    for i in non_food:
        row = by_type.setdefault(i['type'], dict(unit=i['unit'], acquired=0, recycling=0, general=0, continued=0))
        row['acquired'] += int(i['origin'] == 'new' and i['singleUse'])
        row['recycling'] += int(i['destination'] == 'recycling')
        row['general'] += int(i['destination'] == 'general')
        row['continued'] += int(i['destination'] in ('retained', 'repaired', 'transferred'))
    return dict(completedScenes=sum(bool(v.get('selectedChoiceId')) for v in session['visits']),
                totalScenes=len(session['modelSnapshot']),
                newSingleUse=sum(i['origin'] == 'new' and i['singleUse'] for i in non_food),
                nonFoodWaste=len(waste), recycling=sum(i['destination'] == 'recycling' for i in waste),
                general=sum(i['destination'] == 'general' for i in waste),
                foodWaste=sum(i['destination'] == 'food_discard' for i in food),
                foodSaved=sum(i['destination'] == 'saved' for i in food),
                foodTransferred=sum(i['destination'] == 'transferred' for i in food),
                foodInventory=sum(i['destination'] == 'inventory' for i in food),
                continued=[i for i in non_food if i['destination'] in ('retained', 'repaired', 'transferred')],
                byType=by_type, items=items,
                help=sum(e['type'] == 'researcher_help' for e in session['events']))

def main(paths):
    sessions = []
    for path in paths:
        with open(path, encoding='utf-8-sig') as f:
            session = json.load(f)
        if session.get('schemaVersion') != 1:
            raise ValueError('Unsupported schema: ' + path)
        if replay(session) != session['items']:
            raise ValueError('Item replay differs from snapshot: ' + path)
        sessions.append(session)
    if len(sessions) == 1:
        print(json.dumps(analyze(sessions[0]), indent=2))
        return
    writer = csv.writer(sys.stdout)
    writer.writerow(['participant', 'session', 'kind', 'status', 'primary_first', 'scenes', 'new_single_use', 'non_food_discarded', 'food_discarded_servings'])
    seen = set()
    primary = defaultdict(list)
    for s in sorted(sessions, key=lambda x: x['startedAt']):
        participant = s.get('participantCode')
        is_primary = s['kind'] == 'research' and participant and participant not in seen and not s.get('parentSessionId')
        if s['kind'] == 'research' and participant:
            seen.add(participant)
        a = analyze(s)
        writer.writerow([participant or 'none', s['sessionId'], s['kind'], s['status'], bool(is_primary), a['completedScenes'], a['newSingleUse'], a['nonFoodWaste'], a['foodWaste']])
        if is_primary and s['status'] == 'completed':
            primary[s['modelVersion']].append(a)
    for version, rows in primary.items():
        print('\nFirst completed primary research records only; partial first records remain in the table. Model =', version, 'n =', len(rows), file=sys.stderr)
        for key in ('newSingleUse', 'nonFoodWaste', 'foodWaste'):
            values = [a[key] for a in rows]
            if values:
                print(key, 'median =', statistics.median(values), 'range =', (min(values), max(values)), file=sys.stderr)
    print('Versions are grouped separately. No causal or long-term learning inference.', file=sys.stderr)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit('Usage: python analyze_story.py session.json [another-session.json ...]')
    main(sys.argv[1:])
