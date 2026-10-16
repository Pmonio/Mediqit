// Retain bookmarked links without serving the retired sample operations dashboard.
export function GET(request){return Response.redirect(new URL('/responses',request.url),307);}
