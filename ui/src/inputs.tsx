import { Calendar, Checkbox, ChoiceGroup, ColorPicker, ComboBox, CompoundButton, DateRangeType, DefaultButton, Dropdown, DropdownMenuItemType, IButtonStyles, IChoiceGroupOption, IColorCellProps, IContextualMenuItem, IContextualMenuProps, IDropdownOption, ISliderProps, ISpinButtonStyles, IStackItemStyles, IStackTokens, ITag, ITextFieldProps, Label, MaskedTextField, Position, PrimaryButton, Rating, Slider, SpinButton, Stack, SwatchColorPicker, TagPicker, TextField, Toggle } from '@fluentui/react';
import React from 'react';
import styled from 'styled-components';
import { B, isN, isS, isV, isPair, isO, N, S, gensym, xid } from './core';
import * as D from './protocol';

type InputProps = { input: D.Input }
const words = (x: S) => x.trim().split(/\s+/g)
const unum = (x: any): N | undefined => isN(x) ? x : undefined
const ustr = (x: any): S | undefined => isS(x) ? x : undefined
const udate = (x: any): Date | undefined => isS(x) ? new Date(x) : undefined
const snakeToCamelCase = (s: S): S => s.replace(/(_\w)/g, m => m[1].toUpperCase())
const toChoices = (x: any): D.Choice[] => {
  if (!x) return []
  if (Array.isArray(x)) {
    const c: D.Choice[] = []
    for (const v of x) {
      if (isV(v)) { // value
        c.push({ label: String(v), value: v })
      } else if (isPair(v)) { // [label, value]
        const label = v[0], value = v[1]
        if (isS(label) && isV(value)) {
          c.push({ label, value })
        } else {
          console.warn('Invalid choice pair. Want [string, value], got ', v)
        }
      } else if (isO(v) && isV(v.value)) { // { value: v }
        if (!v.label) v.label = String(v.value)
        if (v.choices) v.choices = toChoices(v.choices)
        c.push(v)
      }
    }
    return c
  }
  if (isS(x)) { // 'value1 value2 value3...'
    return words(x).map(value => ({ label: value, value }))
  }
  if (isO(x)) { // { label1: value1, label2: value2, ... }
    const c: D.Choice[] = []
    for (const label in x) {
      const value = x[label]
      if (isV(value)) {
        c.push({ label, value })
      } else {
        console.warn('Invalid choice value in dictionary. Want string or number, got ', value)
      }
    }
    return c
  }
  console.warn('Invalid choice list. Want string or array or dictionary, got ', x)
  return []
}

const getDefaultValue = (value: any, min: any, max: any, step: any): N | undefined => {
  if (isN(value)) return value
  if (isN(min)) return Math.max(0, min)
  if (isN(max)) return Math.min(0, max)
  if (isN(step)) return 0
  return undefined
}
const sanitizeInput = (input: D.Input): D.Input => {
  const { choices, actions, range, inputs } = input
  input.choices = toChoices(choices)
  input.actions = toChoices(actions)
  if (isPair(range)) {
    const [x, y] = range
    if ((isN(x) && isN(y)) || (isS(x) && isS(y))) {
      input.min = x
      input.max = y
    }
  }
  if (Array.isArray(inputs)) {
    input.inputs = inputs.map(sanitizeInput)
  }
  return input as D.Input
}

const majorTheme = {
  textColor: '#dcddde'
}

const WithSend = ({ children }: { children: JSX.Element }) => (
  <Stack horizontal tokens={gap5} >
    <Stack.Item grow>{children}</Stack.Item>
    <Stack.Item>
      <PrimaryButton styles={{ icon: { color: majorTheme.textColor } }} iconProps={{ iconName: 'Send' }} />
    </Stack.Item>
  </ Stack>
)
class XTextField extends React.Component<InputProps, {}> {
  render() {
    const
      { label, placeholder, icon, value, mask, prefix, suffix, error, lines, required, password } = this.props.input,
      props: Partial<ITextFieldProps> = {
        label,
        defaultValue: isS(value) ? value : isN(value) ? String(value) : undefined,
        placeholder: placeholder ?? label ? undefined : 'Message...',
        errorMessage: error,
        required: required === true,
      }

    return password === true
      ? <TextField {...props} type='password' canRevealPassword revealPasswordAriaLabel='Show password' />
      : mask
        ? <MaskedTextField {...props} mask={mask} />
        : lines && (lines >= 1)
          ? <TextField {...props} multiline resizable autoAdjustHeight rows={lines} />
          : <TextField {...props} iconProps={icon ? { iconName: icon } : undefined} prefix={prefix} suffix={suffix} />
  }
}

class XSpinButton extends React.Component<InputProps, {}> {
  // TODO format string
  render() {
    const
      { label, value, min, max, step, precision } = this.props.input

    return (
      <SpinButton
        label={label}
        labelPosition={Position.top}
        defaultValue={isS(value) ? value : isN(value) ? String(value) : undefined}
        min={unum(min)}
        max={unum(max)}
        step={step}
        precision={precision}
        styles={{ labelWrapper: { marginBottom: -4 } }} // Make textbox top match textfield
      />
    )
  }
}

class XSlider extends React.Component<InputProps, {}> {
  // TODO format string
  render() {
    const
      { label, value, min, max, step } = this.props.input,
      originFromZero = isN(min) && min < 0 && isN(max) && max > 0,
      props: Partial<ISliderProps> = { label: label, min: unum(min), max: unum(max), step, originFromZero }

    return Array.isArray(value) && value.length === 2 && isN(value[0]) && isN(value[1])
      ? (
        <Slider
          {...props}
          ranged
          defaultLowerValue={getDefaultValue(value[0], min, max, step)}
          defaultValue={getDefaultValue(value[1], min, max, step)}
        />
      ) : (
        <Slider
          {...props}
          defaultValue={getDefaultValue(value, min, max, step)}
        />
      )

  }
}

const WithLabel = ({ label, children }: { label?: S, children: JSX.Element }) => (
  label
    ? (
      <Stack>
        <Stack.Item>
          <Label>{label}</Label>
        </Stack.Item>
        <Stack.Item>{children}</Stack.Item>
      </Stack>
    ) : (
      children
    )
)


class XRating extends React.Component<InputProps, {}> {
  // TODO format string; aria-label
  render() {
    const
      { label, value, min, max } = this.props.input
    return (
      <WithLabel label={label}>
        <Rating
          defaultRating={unum(value)}
          allowZeroStars={isN(min) && min <= 0}
          max={unum(max)}
        />
      </WithLabel>
    )
  }
}


class XTimePicker extends React.Component<InputProps, {}> {
  render() {
    const
      { label, value } = this.props.input,
      t = String(value).toLowerCase(),
      am = t.endsWith('am'),
      pm = !am && t.endsWith('pm'),
      c24 = !(am || pm),
      hhmmss = c24 ? t : t.substring(0, t.length - 2),
      tokens = hhmmss.split(':'),
      [hh, mm, ss] = tokens.map(t => parseInt(t, 10)),
      hhp = !isNaN(hh),
      mmp = !isNaN(mm),
      ssp = !isNaN(ss),
      hide: IStackItemStyles = { root: { display: 'none' } },
      narrow: Partial<ISpinButtonStyles> = { labelWrapper: { marginBottom: -4 }, spinButtonWrapper: { width: 50 } }


    return (
      <WithLabel label={label}>
        <Stack horizontal horizontalAlign='start' tokens={gap5}>
          <Stack.Item styles={hhp ? undefined : hide}>
            <SpinButton label='Hours' labelPosition={Position.top} defaultValue={String(hh)} min={c24 ? 0 : 1} max={c24 ? 23 : 12} styles={narrow} />
          </Stack.Item>
          <Stack.Item styles={mmp ? undefined : hide}>
            <SpinButton label='Minutes' labelPosition={Position.top} defaultValue={String(mm)} min={0} max={59} styles={narrow} />
          </Stack.Item>
          <Stack.Item styles={ssp ? undefined : hide}>
            <SpinButton label='Seconds' labelPosition={Position.top} defaultValue={String(ss)} min={0} max={59} styles={narrow} />
          </Stack.Item>
          <Stack.Item styles={!c24 ? undefined : hide} align='end'>
            <Toggle offText='AM' onText='PM' defaultChecked={pm} />
          </Stack.Item>
        </Stack>
      </WithLabel>
    )
  }
}

class XCalendar extends React.Component<InputProps, {}> {
  // TODO format string; aria-label
  render() {
    const
      { label, mode, value, min, max } = this.props.input,
      date = udate(value),
      minDate = udate(min),
      maxDate = udate(max),
      dateRangeType = mode === 'week'
        ? DateRangeType.Week
        : mode === 'month'
          ? DateRangeType.Month
          : DateRangeType.Day
    return (
      <WithLabel label={label}>
        <Calendar
          dateRangeType={dateRangeType}
          value={date}
          minDate={minDate}
          maxDate={maxDate}
          isDayPickerVisible={mode !== 'month'}
          highlightSelectedMonth
          showGoToToday
        />
      </WithLabel>
    )
  }
}

class XColorPicker extends React.Component<InputProps, {}> {
  render() {
    const
      { label, value } = this.props.input
    return (
      <WithLabel label={label}>
        <ColorPicker color={isS(value) ? value : '#ff0000'} />
      </WithLabel>
    )
  }
}

const CheckboxContainer = styled.div`
    margin: 0.5rem 0;
  `
class XCheckList extends React.Component<InputProps, {}> {
  render() {
    const
      { label, choices } = this.props.input,
      checkboxes = choices.map(c => (
        <CheckboxContainer key={c.value}>
          <Checkbox label={c.label} checked={c.selected ? true : false} />
        </CheckboxContainer>
      ))

    return (
      <WithLabel label={label}><div>{checkboxes}</div></WithLabel>
    )
  }
}

class XDropdown extends React.Component<InputProps, {}> {
  render() {
    const
      { label, placeholder, error, required, choices } = this.props.input,
      hasGroups = choices.some(c => c.choices?.length ? true : false),
      options: IDropdownOption[] = hasGroups ? toGroupedDropdownOptions(choices) : choices.map(toDropdownOption),
      selectedItem = choices.find(c => c.selected),
      selectedKey = selectedItem ? selectedItem.value : undefined

    return (
      <Dropdown
        label={label}
        placeholder={placeholder}
        options={options}
        selectedKey={selectedKey}
        errorMessage={error}
        required={required ? true : false}
      />
    )
  }
}

class XMultiSelectDropdown extends React.Component<InputProps, {}> {
  render() {
    const
      { label, placeholder, error, required, choices } = this.props.input,
      options: IDropdownOption[] = choices.map(c => ({ key: c.value, text: String(c.label) })),
      selectedKeys = choices.filter(c => c.selected).map(c => String(c.value))

    return (

      <Dropdown
        multiSelect
        label={label}
        placeholder={placeholder}
        options={options}
        defaultSelectedKeys={selectedKeys}
        errorMessage={error}
        required={required ? true : false}
      />
    )
  }
}

class XComboBox extends React.Component<InputProps, {}> {
  render() {
    const
      { label, placeholder, choices } = this.props.input,
      options: IDropdownOption[] = choices.map(c => ({ key: c.value, text: String(c.label) })),
      selectedItem = choices.find(c => c.selected),
      selectedKey = selectedItem ? selectedItem.value : undefined

    return (
      <ComboBox
        allowFreeform
        label={label}
        placeholder={placeholder}
        options={options}
        selectedKey={selectedKey}
      />
    )
  }
}

class XMultiSelectComboBox extends React.Component<InputProps, {}> {
  render() {
    const
      { label, placeholder, choices } = this.props.input,
      options: IDropdownOption[] = choices.map(c => ({ key: c.value, text: String(c.label) })),
      selectedKeys = choices.filter(c => c.selected).map(c => String(c.value))

    return (
      <ComboBox
        allowFreeform
        multiSelect
        label={label}
        placeholder={placeholder}
        options={options}
        selectedKey={selectedKeys}
      />
    )
  }
}

const toContextualMenuItem = (c: D.Choice): IContextualMenuItem => ({
  key: String(c.value),
  text: String(c.label),
  iconProps: c.icon ? { iconName: c.icon } : undefined,
})
const toContextualMenuProps = (cs: D.Choice[]): IContextualMenuProps => ({ items: cs.map(toContextualMenuItem) })

class XMenu extends React.Component<InputProps, {}> {
  render() {
    const
      { label, actions } = this.props.input
    return <PrimaryButton text={label ?? 'Choose an action'} menuProps={toContextualMenuProps(actions)} styles={{ label: { color: majorTheme.textColor } }} />
  }
}

class XButtons extends React.Component<InputProps, {}> {
  render() {
    const
      { inline, actions } = this.props.input,
      horizontal = inline ? true : false,
      styles: IButtonStyles = {
        root: { width: '100%' },
        label: { color: majorTheme.textColor },
      },
      compoundStyles: IButtonStyles = {
        root: { width: '100%', maxWidth: 'auto' },
        label: { color: majorTheme.textColor },
        description: { color: majorTheme.textColor },
      },
      buttons = actions.map(c => {
        const
          text = c.label,
          button = c.selected
            ? c.choices
              ? <PrimaryButton split text={text} styles={styles} menuProps={toContextualMenuProps(c.choices)} />
              : c.caption
                ? <CompoundButton primary text={text} secondaryText={c.caption} styles={compoundStyles} />
                : <PrimaryButton text={text} styles={styles} />
            : c.choices
              ? <DefaultButton split text={text} styles={styles} menuProps={toContextualMenuProps(c.choices)} />
              : c.caption
                ? <CompoundButton text={text} secondaryText={c.caption} styles={compoundStyles} />
                : <DefaultButton text={text} styles={styles} />
        return <Stack.Item key={c.value}>{button}</Stack.Item>
      })
    return <Stack horizontal={horizontal} tokens={gap5}>{buttons}</Stack>

  }
}

const toDropdownOption = (c: D.Choice): IDropdownOption => ({ key: c.value, text: String(c.label) })
const toGroupedDropdownOptions = (choices: D.Choice[]): IDropdownOption[] => {
  const
    options: IDropdownOption[] = [],
    sepSym = gensym('s'),
    groupSym = gensym('g')
  for (const g of choices) {
    if (g.choices?.length) {
      if (options.length) options.push({ key: sepSym(), text: '-', itemType: DropdownMenuItemType.Divider })
      options.push({ key: groupSym(), text: String(g.label), itemType: DropdownMenuItemType.Header })
      for (const c of g.choices) {
        options.push(toDropdownOption(c))
      }
    } else {
      options.push(toDropdownOption(g))
    }
  }
  return options
}

const createAutocompleter = (choices: D.Choice[]) => {
  const
    items: ITag[] = choices.map(c => ({ key: c.value, name: String(c.label) })),
    listContainsTagList = (tag: ITag, tagList?: ITag[]) => (!tagList || !tagList.length || tagList.length === 0)
      ? false
      : tagList.some(compareTag => compareTag.key === tag.key),
    suggest = (filterText: string, tagList?: ITag[]): ITag[] =>
      filterText
        ? items.filter(
          tag => tag.name.toLowerCase().indexOf(filterText.toLowerCase()) === 0 && !listContainsTagList(tag, tagList),
        )
        : [],
    resolve = (item: ITag) => item.name

  return { resolve, suggest }
}


type TagPickerState = {
  autocompleter: ReturnType<typeof createAutocompleter>
}

class XTagPicker extends React.Component<InputProps, TagPickerState> {
  constructor(props: InputProps) {
    super(props)
    const { choices } = props.input
    this.state = {
      autocompleter: createAutocompleter(choices)
    }
  }
  render() {
    const
      { label } = this.props.input,
      { autocompleter } = this.state
    return (
      <WithLabel label={label}>
        <TagPicker onResolveSuggestions={autocompleter.suggest} getTextFromItem={autocompleter.resolve} />
      </WithLabel>
    )
  }
}

const swatchCellSize = 25
class XSwatchPicker extends React.Component<InputProps, {}> {
  render() {
    const
      { label, choices } = this.props.input,
      cells: IColorCellProps[] = choices.map(c => ({ id: String(c.value), label: String(c.label), color: String(c.value) }))

    return (
      <WithLabel label={label}>
        <SwatchColorPicker columnCount={10} colorCells={cells} cellWidth={swatchCellSize} cellHeight={swatchCellSize} />
      </WithLabel>
    )
  }
}

class XChoiceGroup extends React.Component<InputProps, {}> {
  render() {
    const
      { label, placeholder, required, choices } = this.props.input,
      options: IChoiceGroupOption[] = choices.map(({ value, label, icon: iconName }) => ({
        key: String(value),
        text: String(label),
        iconProps: iconName ? { iconName } : undefined,
      })),
      selectedItem = choices.find(c => c.selected),
      selectedKey = selectedItem ? selectedItem.value : undefined

    return (
      <ChoiceGroup
        label={label}
        placeholder={placeholder}
        options={options}
        defaultSelectedKey={selectedKey}
        required={required ? true : false}
      />
    )
  }
}

const gap5: IStackTokens = { childrenGap: 5 }
const inputHasActions = (input: D.Input): B => { // recursive
  const { actions, inputs } = input
  if (actions.length) return true
  if (inputs) for (const child of inputs) if (inputHasActions(child)) return true
  return false
}
const XInput = ({ input }: InputProps) => { // recursive

  // This function contains the heuristics for determining which widget to use.
  // TODO might need a widget= to force which widget to use.

  const { choices, actions, editable, multiple, inputs, inline } = input

  if (inputs) {

    const children = inputs.map(input => {
      const
        size = inline ? input.size : undefined, // only process if inline
        styles = isS(size) ? { root: { width: size } } : undefined,
        grow = isN(size) ? size : styles ? undefined : 1 // set only if not sized

      return (
        <Stack.Item key={xid()} grow={grow} styles={styles} disableShrink>
          <XInput input={input} />
        </Stack.Item >
      )
    })

    return inline
      ? <Stack horizontal tokens={gap5}>{children}</Stack>
      : <Stack tokens={gap5}>{children}</Stack>
  }

  if (choices.length) {
    if (multiple) {
      if (editable) {
        return <XMultiSelectComboBox input={input} />
      }
      const hasLongLabels = choices.some(({ label }) => label && (label.length > 75))
      if (!hasLongLabels && choices.length > 10) {
        return <XMultiSelectDropdown input={input} />
      }
      return <XCheckList input={input} />
    }
    switch (input.mode) {
      case 'tag':
        // 'multiple' implied
        return <XTagPicker input={input} />
      case 'color':
        return <XSwatchPicker input={input} />
      default:
        if (editable) {
          return <XComboBox input={input} />
        }
        const hasGroups = choices.some(c => c.choices?.length ? true : false)
        if (hasGroups || (choices.length > 7)) {
          return <XDropdown input={input} />
        }
        return <XChoiceGroup input={input} />
    }
  }

  if (actions.length) {
    if (actions.length > 5) {
      return <XMenu input={input} />
    }
    return <XButtons input={input} />
  }

  switch (input.mode) {
    case 'rating':
      return <XRating input={input} />
    case 'day':
    case 'month':
    case 'week':
      return <XCalendar input={input} />
    case 'time':
      return <XTimePicker input={input} />
    case 'color':
      return <XColorPicker input={input} />
  }

  const
    { value, min, max, step } = input,
    hasRange = isN(min) && isN(max) && min < max

  if (isN(value) || hasRange) {
    if (!editable && hasRange) {
      const steps = (max - min) / (isN(step) ? step : 1)
      if (steps <= 16) {
        return <XSlider input={input} />
      }
    }
    return <XSpinButton input={input} />
  }
  return <XTextField input={input} />
}

const InputContainer = styled.div`
  box-sizing: border-box;
  padding: 0.5rem 0 2rem 0;
  max-width: 640px;
`
class InputView extends React.Component<InputProps, {}> {
  render() {
    const
      { input } = this.props,
      hasActions = inputHasActions(input),
      form = <XInput input={input}></XInput>,
      body = hasActions ? form : <WithSend>{form}</WithSend>
    return <InputContainer>{body}</InputContainer>
  }
}


