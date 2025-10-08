/**
 * Accessibility utilities for screen readers and keyboard navigation
 */

// Screen reader announcements
let announcementRegion: HTMLElement | null = null

function getAnnouncementRegion(): HTMLElement {
  if (!announcementRegion) {
    announcementRegion = document.createElement('div')
    announcementRegion.setAttribute('aria-live', 'polite')
    announcementRegion.setAttribute('aria-atomic', 'true')
    announcementRegion.setAttribute('class', 'sr-only')
    document.body.appendChild(announcementRegion)
  }
  return announcementRegion
}

/**
 * Announce a message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const region = getAnnouncementRegion()
  region.setAttribute('aria-live', priority)
  region.textContent = message

  // Clear the message after it's been announced
  setTimeout(() => {
    region.textContent = ''
  }, 1000)
}

/**
 * Set focus to an element safely
 */
export function setFocus(element: HTMLElement | null) {
  if (element && typeof element.focus === 'function') {
    element.focus()
  }
}

/**
 * Trap focus within a container (for modals, dropdowns, etc.)
 */
export function trapFocus(container: HTMLElement) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>

  if (focusableElements.length === 0) return () => {}

  const first = focusableElements[0]
  const last = focusableElements[focusableElements.length - 1]

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  container.addEventListener('keydown', handleTabKey)

  // Set initial focus to first element
  first.focus()

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTabKey)
  }
}

/**
 * Generate unique IDs for accessibility attributes
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if an element is visible to screen readers
 */
export function isAccessible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element)
  const rect = element.getBoundingClientRect()

  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    !element.hasAttribute('aria-hidden') &&
    rect.width > 0 &&
    rect.height > 0
  )
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'details summary',
    '[contenteditable="true"]'
  ].join(', ')

  return Array.from(container.querySelectorAll(selector))
    .filter(isAccessible as (el: Element) => el is HTMLElement)
}

/**
 * Create a skip link for keyboard navigation
 */
export function createSkipLink(href: string, text: string): HTMLElement {
  const link = document.createElement('a')
  link.href = href
  link.textContent = text
  link.className = 'skip-link'
  link.setAttribute('aria-label', `Skip to ${text}`)

  // Style the skip link (can be moved to CSS)
  Object.assign(link.style, {
    position: 'absolute',
    top: '-40px',
    left: '6px',
    background: '#000',
    color: '#fff',
    padding: '8px',
    textDecoration: 'none',
    borderRadius: '4px',
    zIndex: '9999',
    transition: 'top 0.3s'
  })

  // Show on focus
  link.addEventListener('focus', () => {
    link.style.top = '6px'
  })

  link.addEventListener('blur', () => {
    link.style.top = '-40px'
  })

  return link
}

/**
 * Add keyboard navigation to a list of items
 */
export function addListKeyboardNavigation(
  listElement: HTMLElement,
  items: HTMLElement[],
  onSelect?: (item: HTMLElement, index: number) => void
) {
  let currentIndex = 0

  const updateActiveItem = (index: number) => {
    items.forEach((item, i) => {
      if (i === index) {
        item.setAttribute('aria-selected', 'true')
        item.classList.add('active')
      } else {
        item.setAttribute('aria-selected', 'false')
        item.classList.remove('active')
      }
    })
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        currentIndex = (currentIndex + 1) % items.length
        updateActiveItem(currentIndex)
        items[currentIndex].focus()
        break

      case 'ArrowUp':
        e.preventDefault()
        currentIndex = (currentIndex - 1 + items.length) % items.length
        updateActiveItem(currentIndex)
        items[currentIndex].focus()
        break

      case 'Home':
        e.preventDefault()
        currentIndex = 0
        updateActiveItem(currentIndex)
        items[currentIndex].focus()
        break

      case 'End':
        e.preventDefault()
        currentIndex = items.length - 1
        updateActiveItem(currentIndex)
        items[currentIndex].focus()
        break

      case 'Enter':
      case ' ':
        e.preventDefault()
        if (onSelect) {
          onSelect(items[currentIndex], currentIndex)
        }
        break

      case 'Escape':
        // Let parent handle escape
        break
    }
  }

  listElement.addEventListener('keydown', handleKeyDown)
  updateActiveItem(0)

  // Return cleanup function
  return () => {
    listElement.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Validate color contrast for accessibility
 */
export function validateColorContrast(
  foreground: string,
  background: string
): { ratio: number; wcagAA: boolean; wcagAAA: boolean } {
  // Convert hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 }
  }

  const getLuminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const fg = hexToRgb(foreground)
  const bg = hexToRgb(background)

  const fgLuminance = getLuminance(fg.r, fg.g, fg.b)
  const bgLuminance = getLuminance(bg.r, bg.g, bg.b)

  const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05)

  return {
    ratio,
    wcagAA: ratio >= 4.5,
    wcagAAA: ratio >= 7
  }
}

/**
 * Check if an element has proper ARIA attributes
 */
export function validateAriaAttributes(element: HTMLElement): {
  valid: boolean
  warnings: string[]
  errors: string[]
} {
  const warnings: string[] = []
  const errors: string[] = []

  // Check for proper role
  const role = element.getAttribute('role')
  if (!role && element.tagName === 'BUTTON') {
    warnings.push('Interactive element should have an explicit role')
  }

  // Check for proper labeling
  const hasLabel = element.hasAttribute('aria-label') ||
                   element.hasAttribute('aria-labelledby') ||
                   element.getAttribute('id') && document.querySelector(`[for="${element.id}"]`)

  if (!hasLabel && element.tagName === 'INPUT') {
    errors.push('Input element should have a label')
  }

  // Check for proper descriptions
  if (element.hasAttribute('aria-describedby')) {
    const describedById = element.getAttribute('aria-describedby')
    const describedElement = describedById ? document.getElementById(describedById) : null
    if (!describedElement) {
      errors.push(`aria-describedby references non-existent element: ${describedById}`)
    }
  }

  // Check for proper states
  if (element.hasAttribute('aria-expanded') && element.tagName !== 'BUTTON') {
    warnings.push('aria-expanded should typically be used on button elements')
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors
  }
}

/**
 * Add keyboard navigation support for custom components
 */
export function createKeyboardBehavior(
  element: HTMLElement,
  config: {
    onEnter?: () => void
    onSpace?: () => void
    onEscape?: () => void
    onArrowUp?: () => void
    onArrowDown?: () => void
    onArrowLeft?: () => void
    onArrowRight?: () => void
    onHome?: () => void
    onEnd?: () => void
    onTab?: () => void
    preventDefault?: string[]
  }
) {
  const {
    onEnter,
    onSpace,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onHome,
    onEnd,
    onTab,
    preventDefault = ['Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
  } = config

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key

    if (preventDefault.includes(key)) {
      e.preventDefault()
    }

    switch (key) {
      case 'Enter':
        onEnter?.()
        break
      case ' ':
        onSpace?.()
        break
      case 'Escape':
        onEscape?.()
        break
      case 'ArrowUp':
        onArrowUp?.()
        break
      case 'ArrowDown':
        onArrowDown?.()
        break
      case 'ArrowLeft':
        onArrowLeft?.()
        break
      case 'ArrowRight':
        onArrowRight?.()
        break
      case 'Home':
        onHome?.()
        break
      case 'End':
        onEnd?.()
        break
      case 'Tab':
        onTab?.()
        break
    }
  }

  element.addEventListener('keydown', handleKeyDown)

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Create a live region for dynamic content announcements
 */
export function createLiveRegion(politeness: 'polite' | 'assertive' | 'off' = 'polite'): HTMLElement {
  const region = document.createElement('div')
  region.setAttribute('aria-live', politeness)
  region.setAttribute('aria-atomic', 'true')
  region.className = 'sr-only'
  document.body.appendChild(region)

  return region
}

/**
 * Announce loading state to screen readers
 */
export function announceLoading(isLoading: boolean, context?: string) {
  const message = isLoading
    ? `Loading${context ? ` ${context}` : ''}...`
    : `${context || 'Content'} loaded.`

  announceToScreenReader(message)
}

/**
 * Announce error messages to screen readers
 */
export function announceError(message: string, context?: string) {
  const fullMessage = context ? `Error in ${context}: ${message}` : `Error: ${message}`
  announceToScreenReader(fullMessage, 'assertive')
}

/**
 * Create a progress bar with proper accessibility
 */
export function createAccessibleProgressBar(
  container: HTMLElement,
  options: {
    value?: number
    min?: number
    max?: number
    label?: string
  } = {}
) {
  const { value = 0, min = 0, max = 100, label = 'Progress' } = options

  const progressBar = document.createElement('div')
  progressBar.setAttribute('role', 'progressbar')
  progressBar.setAttribute('aria-valuenow', value.toString())
  progressBar.setAttribute('aria-valuemin', min.toString())
  progressBar.setAttribute('aria-valuemax', max.toString())
  progressBar.setAttribute('aria-label', label)

  // Add visual styling (can be moved to CSS)
  progressBar.style.cssText = `
    width: 100%;
    height: 8px;
    background-color: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  `

  const progressFill = document.createElement('div')
  progressFill.style.cssText = `
    height: 100%;
    background-color: #3b82f6;
    transition: width 0.3s ease;
  `

  progressBar.appendChild(progressFill)
  container.appendChild(progressBar)

  // Method to update progress
  const updateProgress = (newValue: number) => {
    const clampedValue = Math.max(min, Math.min(max, newValue))
    const percentage = ((clampedValue - min) / (max - min)) * 100

    progressBar.setAttribute('aria-valuenow', clampedValue.toString())
    progressFill.style.width = `${percentage}%`

    // Announce progress for screen readers
    if (clampedValue === max) {
      announceToScreenReader(`${label} complete.`)
    } else if (clampedValue % 25 === 0) { // Announce at 25%, 50%, 75%
      announceToScreenReader(`${label}: ${Math.round(percentage)}% complete.`)
    }
  }

  return {
    element: progressBar,
    updateProgress,
    getValue: () => parseInt(progressBar.getAttribute('aria-valuenow') || '0'),
    getPercentage: () => {
      const currentValue = parseInt(progressBar.getAttribute('aria-valuenow') || '0')
      return ((currentValue - min) / (max - min)) * 100
    }
  }
}