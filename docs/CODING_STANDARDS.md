# Coding Standards

This document outlines the coding standards and conventions enforced throughout the codebase.

## ESLint Configuration

The project uses a comprehensive ESLint configuration that enforces the following standards:

### General Rules

- **Quotes**: Use single quotes for strings (`'string'`)
- **Semicolons**: Always use semicolons at the end of statements
- **Indentation**: Use 2 spaces for indentation
- **Braces**: Use 1TBS (One True Brace Style) with opening braces on the same line
- **Commas**: Use trailing commas in multi-line objects and arrays
- **Spacing**:
  - Space before blocks: `if (condition) {`
  - Space after keywords: `if (condition)`, `function name()`
  - Space around operators: `a = b + c`
  - No space inside brackets: `array[index]`
  - Space around curly braces: `{ key: value }`

### TypeScript Rules

- Use explicit return types for functions when beneficial
- Use `const` and `let` instead of `var`
- Prefer `const` over `let` when variables are not reassigned
- Avoid using `any` type (warned but not error)
- Use proper TypeScript interfaces and types
- Use generic types where appropriate

### Import/Export Rules

- Use ES6 import/export syntax
- Sort imports alphabetically
- Use absolute imports with path aliases (`@/` prefix)
- Group related imports together

### React Rules

- Use functional components with hooks
- Use TypeScript interfaces for props
- Properly type component props and return values
- Follow React best practices for hooks usage

## File Structure and Naming

### File Naming

- Use kebab-case for file names: `user-profile.tsx`, `api-handler.ts`
- Component files should use `.tsx` extension
- Utility files should use `.ts` extension
- Test files should use `.test.ts` or `.test.tsx` extension

### Directory Structure

```
src/
├── app/              # Next.js App Router pages & API routes
├── components/       # Reusable React components
│   └── ui/          # shadcn/ui components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and configurations
├── services/        # Business logic and external services
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Code Style Examples

### Functions

```typescript
// Good
export async function getUserById(id: string): Promise<User | null> {
  try {
    return await db.user.findUnique({ where: { id } });
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Bad (missing return type, inconsistent spacing)
export async function getUserById(id) {
  try{
    return await db.user.findUnique({where: {id}})
  } catch(error) {
    console.error('Error fetching user:',error)
    return null
  }
}
```

### Components

```typescript
// Good
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ variant, size, onClick, children }: ButtonProps): JSX.Element {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// Bad (missing types, inconsistent formatting)
export function Button({variant, size, onClick, children}) {
  return <button className={cn(buttonVariants({variant,size}))} onClick={onClick}>
    {children}
  </button>
}
```

### API Routes

```typescript
// Good
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ... rest of the logic

  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Bad (missing return types, inconsistent spacing)
export async function GET(request) {
  try{
    const session = await getServerSession(authOptions)

    if (!session?.user){
      return NextResponse.json({error:'Unauthorized'},{status:401})
    }
  } catch(error){
    console.error('Error:',error)
    return NextResponse.json({error:'Internal server error'},{status:500})
  }
}
```

## Best Practices

### Error Handling

- Always include proper error handling in async functions
- Use try-catch blocks appropriately
- Log errors for debugging
- Return meaningful error messages

### Type Safety

- Use TypeScript interfaces for object shapes
- Prefer union types over enums when appropriate
- Use generic types for reusable functions
- Avoid type assertions unless necessary

### Performance

- Use React.memo for expensive components
- Implement proper loading states
- Use appropriate data fetching patterns
- Optimize bundle size through dynamic imports

### Security

- Validate all user inputs
- Use environment variables for sensitive data
- Implement proper authentication and authorization
- Sanitize data before database operations

## Enforcement

These coding standards are enforced through:

1. **ESLint**: Automatic linting in development
2. **TypeScript**: Type checking at compile time
3. **Code Review**: Manual review during pull requests
4. **Pre-commit Hooks**: Automated checks before commits

## Tools Used

- **ESLint**: For linting and code style enforcement
- **TypeScript**: For type safety
- **Prettier**: For code formatting (can be integrated)
- **Husky**: For git hooks (optional)

## Contributing

When contributing to this codebase:

1. Follow these coding standards
2. Run the linter before committing
3. Add type definitions for new components
4. Write tests for new functionality
5. Update documentation when necessary

---

This document serves as a guide for maintaining consistent code quality across the project. All team members should familiarize themselves with these standards and apply them consistently.