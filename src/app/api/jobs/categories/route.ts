import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const categories = await db.jobCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    const transformedCategories = categories.map(category => ({
      id: category.categoryId,
      name: category.name,
      description: category.description,
      slug: category.slug,
      icon: category.icon,
      color: category.color
    }))

    return NextResponse.json(transformedCategories)

  } catch (error) {
    console.error('Error fetching job categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, icon, color } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    // Check if category already exists
    const existingCategory = await db.jobCategory.findFirst({
      where: {
        OR: [
          { name },
          { slug }
        ]
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name or slug already exists' },
        { status: 400 }
      )
    }

    const category = await db.jobCategory.create({
      data: {
        name,
        description,
        slug,
        icon,
        color
      }
    })

    const transformedCategory = {
      id: category.categoryId,
      name: category.name,
      description: category.description,
      slug: category.slug,
      icon: category.icon,
      color: category.color
    }

    return NextResponse.json(transformedCategory, { status: 201 })

  } catch (error) {
    console.error('Error creating job category:', error)
    return NextResponse.json(
      { error: 'Failed to create job category' },
      { status: 500 }
    )
  }
}