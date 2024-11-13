import fs from 'fs-extra'

fs.writeFileSync('./cache/cache_updated_at.json', JSON.stringify({ updated_at: new Date() }))