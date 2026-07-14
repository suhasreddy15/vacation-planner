import { FiSearch } from 'react-icons/fi';
import './SearchBar.css';

function SearchBar({ value, onChange }) {
  return (
    <label className="search-bar">
      <FiSearch aria-hidden="true" />
      <input
        type="search"
        placeholder="Search destinations, experiences, or locations"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export default SearchBar;
