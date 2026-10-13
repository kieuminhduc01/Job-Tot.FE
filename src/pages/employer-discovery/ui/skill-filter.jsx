import { useEffect, useId, useRef, useState } from 'react';
import { Popover } from 'radix-ui';
import { Check, ChevronDown, Search } from 'lucide-react';

function normalize(value) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase('vi').trim();
}

export function SkillFilter({ skills, value, onChange }) {
  const id = useId();
  const input = useRef(null);
  const list = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('');
  const matches = skills.filter(skill => normalize(skill).includes(normalize(query)));
  const options = ['', ...matches];
  const activeIndex = Math.max(0, options.indexOf(active));
  const listId = `${id}-options`;

  useEffect(() => {
    if (open) list.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, query]);

  function changeOpen(next) {
    setOpen(next);
    if (next) { setQuery(''); setActive(value); }
  }

  function choose(skill) {
    setOpen(false);
    if (skill !== value) onChange(skill);
  }

  function search(next) {
    setQuery(next);
    setActive(next.trim() ? skills.find(skill => normalize(skill).includes(normalize(next))) || '' : value);
  }

  function navigate(event) {
    if (event.nativeEvent.isComposing) return;
    const directions = { ArrowDown: 1, ArrowUp: -1 };
    if (event.key in directions) {
      event.preventDefault();
      setActive(options[Math.max(0, Math.min(options.length - 1, activeIndex + directions[event.key]))]);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setActive(options[event.key === 'Home' ? 0 : options.length - 1]);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(options[activeIndex]);
    }
  }

  return <div className="td-skill-filter">
    <label htmlFor={id}>Kỹ năng</label>
    <Popover.Root open={open} onOpenChange={changeOpen}>
      <Popover.Trigger asChild>
        <button id={id} type="button" className="td-skill-trigger" aria-label="Kỹ năng"><span>{value || 'Tất cả kỹ năng'}</span><ChevronDown /></button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="td-skill-popover font-roboto" aria-label="Chọn kỹ năng" sideOffset={6} align="start" collisionPadding={12} onOpenAutoFocus={event => { event.preventDefault(); input.current?.focus(); }}>
          <div className="td-skill-search"><Search aria-hidden="true" /><input ref={input} role="combobox" aria-label="Tìm kỹ năng" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={`${listId}-${activeIndex}`} placeholder="Tìm kỹ năng…" autoComplete="off" value={query} onChange={event => search(event.target.value)} onKeyDown={navigate} /></div>
          <div ref={list} id={listId} className="td-skill-options" role="listbox" aria-label="Danh sách kỹ năng">
            {options.map((skill, index) => <button key={skill} id={`${listId}-${index}`} type="button" role="option" tabIndex={-1} aria-selected={skill === value} data-active={index === activeIndex} onMouseDown={event => event.preventDefault()} onPointerMove={() => setActive(skill)} onClick={() => choose(skill)}><span>{skill || 'Tất cả kỹ năng'}</span>{skill === value && <Check aria-hidden="true" />}</button>)}
          </div>
          {!matches.length && <p role="status" className="td-skill-empty">Không tìm thấy kỹ năng phù hợp.</p>}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  </div>;
}
