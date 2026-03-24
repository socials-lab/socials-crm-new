import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    const { name, email, phone, company, interaction_type, interaction_title, metadata } = body

    if (!name || !email || !interaction_type || !interaction_title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, interaction_type, interaction_title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Upsert prospect by email (case-insensitive)
    const { data: existingProspect } = await supabase
      .from('prospects')
      .select('id')
      .ilike('email', email.trim())
      .maybeSingle()

    let prospectId: string

    if (existingProspect) {
      prospectId = existingProspect.id
      // Update name/phone/company if provided and prospect exists
      const updates: Record<string, string> = {}
      if (name) updates.name = name.trim()
      if (phone) updates.phone = phone.trim()
      if (company) updates.company = company.trim()
      
      await supabase
        .from('prospects')
        .update(updates)
        .eq('id', prospectId)
    } else {
      const { data: newProspect, error: insertError } = await supabase
        .from('prospects')
        .insert({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone?.trim() || null,
          company: company?.trim() || null,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Error creating prospect:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to create prospect', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      prospectId = newProspect.id
    }

    // Insert interaction
    const { error: interactionError } = await supabase
      .from('prospect_interactions')
      .insert({
        prospect_id: prospectId,
        type: interaction_type,
        title: interaction_title.trim(),
        metadata: metadata || null,
        occurred_at: new Date().toISOString(),
      })

    if (interactionError) {
      console.error('Error creating interaction:', interactionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create interaction', details: interactionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, prospect_id: prospectId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
