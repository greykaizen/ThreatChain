const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

async function debugUpload() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const filePath = path.join(process.cwd(), 'sample-stix-2.1.json');
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = 'debug-test-' + Date.now() + '.json';
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const storagePath = `${hash}-${fileName}`;

  console.log('⏳ Attempting upload to bucket: reports');
  console.log('📍 File:', storagePath);

  try {
    const { data, error } = await supabase.storage
      .from('reports')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/json',
        upsert: true
      });

    if (error) {
      console.error('❌ Storage Error:', error.message);
      console.error('Full Error:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('✅ Upload Success!');
    const { data: { publicUrl } } = supabase.storage.from('reports').getPublicUrl(storagePath);
    console.log('🔗 Public URL:', publicUrl);

  } catch (err) {
    console.error('💥 Execution Error:', err.message);
  }
}

debugUpload();
