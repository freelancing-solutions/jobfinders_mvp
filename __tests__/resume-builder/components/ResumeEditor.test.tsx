import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResumeEditor } from '@/components/resume/ResumeEditor';
import { useRealTimeSuggestions } from '@/hooks/use-real-time-suggestions';

// Mock the hook
jest.mock('@/hooks/use-real-time-suggestions');
jest.mock('@/hooks/use-resume-editor', () => ({
  useResumeEditor: () => ({
    resumeData: {
      personal: {
        professionalTitle: 'Software Engineer',
        summary: 'Experienced software developer',
        email: 'john@example.com',
        phone: '+1-555-0123',
        location: 'San Francisco, CA',
      },
      experience: [
        {
          id: 'exp-1',
          company: 'Tech Corp',
          position: 'Senior Developer',
          startDate: '2020-01-01',
          endDate: '2023-12-31',
          isCurrent: false,
          description: 'Developed web applications',
        },
      ],
      education: [
        {
          id: 'edu-1',
          institution: 'University',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2016-09-01',
          endDate: '2020-05-31',
          isCurrent: false,
        },
      ],
      skills: ['JavaScript', 'React', 'Node.js'],
    },
    updatePersonalInfo: jest.fn(),
    updateExperience: jest.fn(),
    updateEducation: jest.fn(),
    addExperience: jest.fn(),
    addEducation: jest.fn(),
    removeExperience: jest.fn(),
    removeEducation: jest.fn(),
    reorderSections: jest.fn(),
    saveResume: jest.fn(),
    isSaving: false,
    lastSaved: null,
    errors: {},
  }),
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="card-title">{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => <input data-testid="input" {...props} />,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea data-testid="textarea" {...props} />
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button data-testid="button" {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: { children: React.ReactNode }) => <label data-testid="label">{children}</label>,
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      data-testid="switch"
    />
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
}));

jest.mock('@/components/ui/accordion', () => ({
  Accordion: ({ children }: { children: React.ReactNode }) => <div data-testid="accordion">{children}</div>,
  AccordionContent: ({ children }: { children: React.ReactNode }) => <div data-testid="accordion-content">{children}</div>,
  AccordionItem: ({ children }: { children: React.ReactNode }) => <div data-testid="accordion-item">{children}</div>,
  AccordionTrigger: ({ children }: { children: React.ReactNode }) => <button data-testid="accordion-trigger">{children}</button>,
}));

describe('ResumeEditor', () => {
  const mockUseRealTimeSuggestions = useRealTimeSuggestions as jest.MockedFunction<typeof useRealTimeSuggestions>;

  beforeEach(() => {
    mockUseRealTimeSuggestions.mockReturnValue({
      suggestions: [],
      loading: false,
      error: null,
      lastUpdated: null,
      contextualSuggestions: [],
      contextualLoading: false,
      contextualError: null,
      currentField: '',
      currentValue: '',
      generateSuggestions: jest.fn(),
      generateContextualSuggestions: jest.fn(),
      dismissContextualSuggestion: jest.fn(),
      grammarErrors: [],
      correctedText: '',
      grammarScore: 100,
      grammarLoading: false,
      grammarError: null,
      checkGrammar: jest.fn(),
      analyzeKeywords: jest.fn(),
      acceptSuggestion: jest.fn(),
      rejectSuggestion: jest.fn(),
      clearSuggestions: jest.fn(),
    });
  });

  describe('rendering', () => {
    it('should render resume editor with all sections', () => {
      render(<ResumeEditor />);

      expect(screen.getByText('Resume Editor')).toBeInTheDocument();
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Experience')).toBeInTheDocument();
      expect(screen.getByText('Education')).toBeInTheDocument();
      expect(screen.getByText('Skills')).toBeInTheDocument();
    });

    it('should display current resume data', () => {
      render(<ResumeEditor />);

      expect(screen.getByDisplayValue('Software Engineer')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Experienced software developer')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Tech Corp')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Senior Developer')).toBeInTheDocument();
    });

    it('should render collapsible sections', () => {
      render(<ResumeEditor />);

      const accordionTriggers = screen.getAllByTestId('accordion-trigger');
      expect(accordionTriggers.length).toBeGreaterThan(0);
    });
  });

  describe('personal information editing', () => {
    it('should update professional title when changed', async () => {
      const mockUpdatePersonalInfo = jest.fn();
      jest.doMock('@/hooks/use-resume-editor', () => ({
        useResumeEditor: () => ({
          resumeData: {
            personal: { professionalTitle: 'Software Engineer' },
          },
          updatePersonalInfo: mockUpdatePersonalInfo,
        }),
      }));

      render(<ResumeEditor />);

      const titleInput = screen.getByDisplayValue('Software Engineer');
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Senior Software Engineer');

      // The update should be called with the new value
      await waitFor(() => {
        expect(mockUpdatePersonalInfo).toHaveBeenCalledWith(
          expect.objectContaining({
            professionalTitle: 'Senior Software Engineer',
          })
        );
      });
    });

    it('should update email when changed', async () => {
      const mockUpdatePersonalInfo = jest.fn();
      jest.doMock('@/hooks/use-resume-editor', () => ({
        useResumeEditor: () => ({
          resumeData: {
            personal: { email: 'john@example.com' },
          },
          updatePersonalInfo: mockUpdatePersonalInfo,
        }),
      }));

      render(<ResumeEditor />);

      const emailInput = screen.getByDisplayValue('john@example.com');
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'john.doe@example.com');

      await waitFor(() => {
        expect(mockUpdatePersonalInfo).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'john.doe@example.com',
          })
        );
      });
    });

    it('should trigger contextual suggestions when field is focused', async () => {
      const mockGenerateContextualSuggestions = jest.fn();
      mockUseRealTimeSuggestions.mockReturnValue({
        ...mockUseRealTimeSuggestions(),
        generateContextualSuggestions: mockGenerateContextualSuggestions,
      });

      render(<ResumeEditor />);

      const titleInput = screen.getByDisplayValue('Software Engineer');
      await userEvent.click(titleInput);

      await waitFor(() => {
        expect(mockGenerateContextualSuggestions).toHaveBeenCalledWith(
          'personal.professionalTitle',
          'Software Engineer',
          expect.any(Object)
        );
      });
    });
  });

  describe('experience section', () => {
    it('should display experience entries', () => {
      render(<ResumeEditor />);

      expect(screen.getByDisplayValue('Tech Corp')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Senior Developer')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Developed web applications')).toBeInTheDocument();
    });

    it('should add new experience when add button is clicked', async () => {
      const mockAddExperience = jest.fn();
      jest.doMock('@/hooks/use-resume-editor', () => ({
        useResumeEditor: () => ({
          resumeData: { experience: [] },
          addExperience: mockAddExperience,
        }),
      }));

      render(<ResumeEditor />);

      const addButton = screen.getByText('Add Experience');
      await userEvent.click(addButton);

      expect(mockAddExperience).toHaveBeenCalled();
    });

    it('should remove experience when remove button is clicked', async () => {
      const mockRemoveExperience = jest.fn();
      jest.doMock('@/hooks/use-resume-editor', () => ({
        useResumeEditor: () => ({
          resumeData: {
            experience: [{ id: 'exp-1', company: 'Tech Corp' }],
          },
          removeExperience: mockRemoveExperience,
        }),
      }));

      render(<ResumeEditor />);

      const removeButton = screen.getByText('Remove');
      await userEvent.click(removeButton);

      expect(mockRemoveExperience).toHaveBeenCalledWith('exp-1');
    });

    it('should update current work toggle', async () => {
      const mockUpdateExperience = jest.fn();
      jest.doMock('@/hooks/use-resume-editor', () => ({
        useResumeEditor: () => ({
          resumeData: {
            experience: [{ id: 'exp-1', isCurrent: false }],
          },
          updateExperience: mockUpdateExperience,
        }),
      }));

      render(<ResumeEditor />);

      const currentWorkSwitch = screen.getByTestId('switch');
      await userEvent.click(currentWorkSwitch);

      expect(mockUpdateExperience).toHaveBeenCalledWith(
        'exp-1',
        expect.objectContaining({
          isCurrent: true,
        })
      );
    });
  });

  describe('education section', () => {
    it('should display education entries', () => {
      render(<ResumeEditor />);

      expect(screen.getByDisplayValue('University')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Bachelor of Science')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Computer Science')).toBeInTheDocument();
    });

    it('should add new education when add button is clicked', async () => {
      const mockAddEducation = jest.fn();
      jest.doMock('@/hooks/use-resume-editor', () => ({
        useResumeEditor: () => ({
          resumeData: { education: [] },
          addEducation: mockAddEducation,
        }),
      }));

      render(<ResumeEditor />);

      const addButton = screen.getByText('Add Education');
      await userEvent.click(addButton);

      expect(mockAddEducation).toHaveBeenCalled();
    });
  });

  describe('auto-save functionality', () => {
    it('should show save status when saving', async () => {
      jest.doMock('@/hooks/use-resume-editor', () => ({
        useResumeEditor: () => ({
          resumeData: { personal: {} },
          isSaving: true,
          saveResume: jest.fn(),
        }),
      }));

      render(<ResumeEditor />);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should show last saved time', async () => {
      const lastSaved = new Date('2023-01-01T12:00:00');
      jest.doMock('@/hooks/use-resume-editor', () => ({
        useResumeEditor: () => ({
          resumeData: { personal: {} },
          lastSaved,
          saveResume: jest.fn(),
        }),
      }));

      render(<ResumeEditor />);

      expect(screen.getByText(/Last saved:/)).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should display validation errors', async () => {
      jest.doMock('@/hooks/use-resume-editor', () => ({
        useResumeEditor: () => ({
          resumeData: { personal: {} },
          errors: {
            'personal.email': 'Invalid email format',
            'personal.phone': 'Phone number is required',
          },
        }),
      }));

      render(<ResumeEditor />);

      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      expect(screen.getByText('Phone number is required')).toBeInTheDocument();
    });

    it('should display API errors', async () => {
      mockUseRealTimeSuggestions.mockReturnValue({
        ...mockUseRealTimeSuggestions(),
        error: 'Failed to load suggestions',
      });

      render(<ResumeEditor />);

      expect(screen.getByText('Failed to load suggestions')).toBeInTheDocument();
    });
  });

  describe('keyboard interactions', () => {
    it('should support keyboard navigation in forms', async () => {
      render(<ResumeEditor />);

      const titleInput = screen.getByDisplayValue('Software Engineer');
      const summaryTextarea = screen.getByDisplayValue('Experienced software developer');

      titleInput.focus();
      await userEvent.tab();

      expect(summaryTextarea).toHaveFocus();
    });

    it('should support form submission with Enter key', async () => {
      const mockSaveResume = jest.fn();
      jest.doMock('@/hooks/use-resume-editor', () => ({
        useResumeEditor: () => ({
          resumeData: { personal: {} },
          saveResume: mockSaveResume,
        }),
      }));

      render(<ResumeEditor />);

      const titleInput = screen.getByDisplayValue('Software Engineer');
      titleInput.focus();
      await userEvent.keyboard('{Enter}');

      // Enter in input field should not submit form (just move to next field)
      expect(mockSaveResume).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ResumeEditor />);

      const titleInput = screen.getByDisplayValue('Software Engineer');
      expect(titleInput).toHaveAttribute('aria-label');

      const sections = screen.getAllByRole('button');
      sections.forEach(section => {
        expect(section).toHaveAttribute('aria-expanded');
      });
    });

    it('should support screen reader announcements', async () => {
      const mockAnnounce = jest.fn();
      window.announce = mockAnnounce;

      const mockGenerateContextualSuggestions = jest.fn();
      mockUseRealTimeSuggestions.mockReturnValue({
        ...mockUseRealTimeSuggestions(),
        contextualSuggestions: [
          {
            id: 'suggestion-1',
            title: 'Add metrics',
            description: 'Include specific numbers',
          },
        ],
      });

      render(<ResumeEditor />);

      const titleInput = screen.getByDisplayValue('Software Engineer');
      await userEvent.click(titleInput);

      await waitFor(() => {
        expect(mockAnnounce).toHaveBeenCalled();
      });
    });
  });
});