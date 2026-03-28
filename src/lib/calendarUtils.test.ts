import { describe, it, expect } from 'vitest'
import { slotKey, parseSlotKey, getMondayOfWeek, getWeekDays, formatColumnHeader, formatWeekLabel, HOURS } from './calendarUtils'

describe('calendarUtils', () => {
  describe('slotKey', () => {
    it("slotKey({ dayOfWeek: 1, hour: 9, minute: 0 }) returns '1:9:0'", () => {
      expect(slotKey({ dayOfWeek: 1, hour: 9, minute: 0 })).toBe('1:9:0')
    })

    it("slotKey({ dayOfWeek: 0, hour: 19, minute: 30 }) returns '0:19:30'", () => {
      expect(slotKey({ dayOfWeek: 0, hour: 19, minute: 30 })).toBe('0:19:30')
    })
  })

  describe('parseSlotKey', () => {
    it("parseSlotKey('1:9:0') returns { dayOfWeek: 1, hour: 9, minute: 0 }", () => {
      expect(parseSlotKey('1:9:0')).toEqual({ dayOfWeek: 1, hour: 9, minute: 0 })
    })
  })

  describe('HOURS', () => {
    it('HOURS is [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19] (13 entries)', () => {
      expect(HOURS).toEqual([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19])
      expect(HOURS).toHaveLength(13)
    })
  })

  describe('getMondayOfWeek', () => {
    it('getMondayOfWeek(0) returns a Date that is a Monday', () => {
      const monday = getMondayOfWeek(0)
      expect(monday.getDay()).toBe(1) // 1 = Monday in JS
    })
  })

  describe('getWeekDays', () => {
    it('getWeekDays(0) returns 7 dates starting from Monday', () => {
      const days = getWeekDays(0)
      expect(days).toHaveLength(7)
      expect(days[0].getDay()).toBe(1) // Monday
    })

    it('getWeekDays(0)[6] is a Sunday', () => {
      const days = getWeekDays(0)
      expect(days[6].getDay()).toBe(0) // 0 = Sunday in JS
    })
  })

  describe('formatColumnHeader', () => {
    it("formatColumnHeader for a Monday the 24th returns 'Mon 24'", () => {
      // Create a known Monday: March 24, 2025 is a Monday
      const monday = new Date(2025, 2, 24) // March 24, 2025
      expect(formatColumnHeader(monday)).toBe('Mon 24')
    })
  })

  describe('formatWeekLabel', () => {
    it("formatWeekLabel returns string starting with 'Week of'", () => {
      const monday = getMondayOfWeek(0)
      expect(formatWeekLabel(monday)).toMatch(/^Week of/)
    })
  })
})
