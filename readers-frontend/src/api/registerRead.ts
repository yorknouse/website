// src/pages/api/registerRead.ts
import prisma from "src/prisma";

const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://nouse.co.uk',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    // Preflight response
    return new Response(null, {
        status: 204,
        headers: corsHeaders,
    });
}

export async function POST(context: { request: Request }) {
    try {
        const body = await context.request.formData();
        const articleId = body.get('articleId');

        if (!articleId || typeof articleId !== 'string') {
            return new Response('Missing articleId', { status: 400, headers: corsHeaders });
        }

        const sanitizedId = articleId.replace(/\D/g, '');

        const result = await prisma.articlesReads.create({
            data: { articles_id: Number(sanitizedId) },
        });

        if (result) {
            return new Response(null, { status: 204, headers: corsHeaders }); // success, no content
        } else {
            return new Response('Insert failed', { status: 500, headers: corsHeaders });
        }
    } catch (err) {
        console.error('Error in registerRead:', err);
        return new Response('Internal server error', { status: 500, headers: corsHeaders });
    }
}
