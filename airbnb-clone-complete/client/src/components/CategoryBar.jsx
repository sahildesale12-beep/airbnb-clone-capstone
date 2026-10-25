import { BedDouble, Building2, Flame, Flower2, House, Landmark, Palmtree, SlidersHorizontal, Sparkles, Waves, Warehouse } from 'lucide-react';

const categories = [
  { label: 'Bed & breakfasts', value: 'bed & breakfasts', Icon: BedDouble },
  { label: 'Icons', value: 'icons', Icon: Sparkles },
  { label: 'Historical homes', value: 'historical homes', Icon: Landmark },
  { label: 'Trending', value: 'trending', Icon: Flame },
  { label: 'Tropical', value: 'tropical', Icon: Palmtree },
  { label: 'Domes', value: 'domes', Icon: House },
  { label: 'Barns', value: 'barns', Icon: Warehouse },
  { label: 'Luxe', value: 'luxe', Icon: Building2 },
  { label: 'Amazing pools', value: 'amazing pools', Icon: Waves },
];

export default function CategoryBar({ selected, onSelect, onFilters, includeTotal, onIncludeTotal }) {
  return <div className="category-wrap">
    <div className="category-scroller">{categories.map(({ label, value, Icon }) => <button key={value} onClick={() => onSelect(selected === value ? '' : value)} className={`category-item ${selected === value ? 'category-active' : ''}`}><Icon size={22} strokeWidth={1.7}/><span>{label}</span></button>)}</div>
    <button className="outline-filter" onClick={() => onFilters?.()}><SlidersHorizontal size={16}/> Filters</button>
    <label className="tax-toggle"><span>Display total before taxes</span><input type="checkbox" checked={includeTotal} onChange={(e) => onIncludeTotal(e.target.checked)}/><span className="toggle-ui"/></label>
  </div>;
}
