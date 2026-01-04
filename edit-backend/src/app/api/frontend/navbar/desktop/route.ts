import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ICategory } from "@/lib/types";
import { cache } from "@/lib/cache";
import { validateDesktopNavBar } from "@/lib/validation/navbar";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const { active, menuCategories, subMenuCategories } =
      validateDesktopNavBar(formData);

    const menuCategoriesHere: ICategory[] = menuCategories;

    const subMenuCategoriesHere = new Map<string, ICategory[]>(
      subMenuCategories,
    );

    const activeCategory = active
      ? await cache(`category:name:${active}`, 7200, () =>
          prisma.categories.findFirst({
            where: {
              categories_name: active,
            },
          }),
        )
      : undefined;

    let parentColour = undefined;
    let parentCategory: ICategory | null = null;
    let subMenuItems = active ? subMenuCategoriesHere.get(active) : undefined;
    if (
      activeCategory &&
      activeCategory.categories_nestUnder &&
      activeCategory.categories_nestUnder !== 4
    ) {
      // Mask muse out of this as muse categories are nested
      parentCategory = await cache(
        `category:id:${activeCategory.categories_nestUnder}`,
        7200,
        () =>
          prisma.categories.findFirst({
            where: {
              categories_id: Number(activeCategory.categories_nestUnder),
            },
          }),
      );

      if (parentCategory) {
        parentColour = parentCategory.categories_backgroundColor;
        subMenuItems = subMenuCategoriesHere.get(
          parentCategory.categories_name,
        );
      }
    }

    let computedBaseColour = "#000";

    if (activeCategory?.categories_backgroundColor) {
      computedBaseColour = activeCategory.categories_backgroundColor;
    } else if (parentColour) computedBaseColour = parentColour;

    if (!menuCategoriesHere || menuCategoriesHere.length === 0) {
      return NextResponse.json(
        { message: "Menu categories not found" },
        { status: 404, headers: corsHeaders },
      );
    }

    return NextResponse.json(
      {
        subMenuCategories: Array.from(subMenuCategoriesHere.entries()),
        activeCategory: activeCategory,
        parentCategory: parentCategory,
        subMenuItems: subMenuItems,
        computedBaseColour: computedBaseColour,
      },
      {
        headers: corsHeaders,
      },
    );
  } catch (err) {
    console.error("Error in desktop navbar:", err);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500, headers: corsHeaders },
    );
  }
}
