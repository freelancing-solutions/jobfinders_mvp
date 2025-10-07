


# Bad Design with Roles
We need to avoid things like this and instead use 

const roleText = role === 'EMPLOYER' ? 'employer' : 'job seeker';

### Enums 
--------------------------------------


## Here is a Proper Solution

// types/roles.ts
export enum UserRole {
  EMPLOYER = 'EMPLOYER',
  JOB_SEEKER = 'JOB_SEEKER',
  ADMIN = 'ADMIN'
}

export const RoleDisplayText = {
  [UserRole.EMPLOYER]: 'employer',
  [UserRole.JOB_SEEKER]: 'job seeker', 
  [UserRole.ADMIN]: 'administrator'
} as const;

// Usage
const roleText = RoleDisplayText[role]; // Fully type-safe!


