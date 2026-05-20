import { NextResponse } from 'next/server'

const OWNER = 'timbenniks'
const REPO = 'turbo-overwatch'
const WORKFLOW_FILE = 'snapshot.yml'
const REF = 'main'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const token = process.env.GH_DISPATCH_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'missing GH_DISPATCH_TOKEN' }, { status: 500 })
  }

  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'turbo-overwatch-cron',
      },
      body: JSON.stringify({ ref: REF }),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    return NextResponse.json(
      { error: 'dispatch failed', status: res.status, body },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true, dispatched: WORKFLOW_FILE, ref: REF })
}
