// MySkills - Claude Code Skill Manager (Electron 内置服务器)
import express from 'express'
import { gitP } from 'simple-git'
import path from 'path'
import fs from 'fs'

const DATA_DIR = path.join(process.env.USERPROFILE, '.my-skills')
const CONFIG_FILE = path.join(DATA_DIR, 'config.json')

const app = express()
app.use(express.json())
app.use(express.static('../public'))

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// 加载/初始化配置
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))

    // 如果没有 skill_sources，根据 skill_paths 自动初始化
    if (!config.skill_sources) {
      config.skill_sources = {
        ClaudeCode: config.skill_paths || [],
        Cursor: [],
        CodeBuddy: []
      }
    }

    return config
  }

  // 首次运行，默认所有路径都是 ClaudeCode
  return {
    skill_paths: [
      'C:\\Users\\sunlc\\.claude\\skills',
      'E:\\04-code\\01-glodon\\01-java\\FSSC\\fssc-svc\\.claude\\skills',
      'E:\\04-code\\01-glodon\\01-java\\FSSC_BILL_SERVICE\\.claude\\skills',
      'E:\\04-code\\01-glodon\\02-abap\\S4_DEV_300\\.claude\\skills',
    ],
    git_config: {
      user_name: 'MySkills',
      user_email: 'my-skills@local'
    },
    skill_sources: {
      ClaudeCode: [
        'C:\\Users\\sunlc\\.claude\\skills',
        'E:\\04-code\\01-glodon\\01-java\\FSSC\\fssc-svc\\.claude\\skills',
        'E:\\04-code\\01-glodon\\01-java\\FSSC_BILL_SERVICE\\.claude\\skills',
        'E:\\04-code\\01-glodon\\02-abap\\S4_DEV_300\\.claude\\skills',
      ],
      Cursor: [],
      CodeBuddy: []
    }
  }
}

function saveConfig(config) {
  if (!config.excluded_skills) {
    config.excluded_skills = []
  }
  if (!config.skill_remotes) {
    config.skill_remotes = {}
  }
  if (!config.skill_sources) {
    config.skill_sources = {
      ClaudeCode: config.skill_paths || [],
      Cursor: [],
      CodeBuddy: []
    }
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

// 根据路径匹配skill来源
function matchSource(skillPath, config) {
  const sources = config.skill_sources || {}

  for (const [source, paths] of Object.entries(sources)) {
    if (Array.isArray(paths)) {
      for (const p of paths) {
        const normalizedPath = p.replace(/\\+$/, '').replace(/\/+$/, '')
        const normalizedSkillPath = skillPath.replace(/\\+$/, '').replace(/\/+$/, '')

        if (normalizedSkillPath.startsWith(normalizedPath)) {
          return source
        }
      }
    }
  }

  return null
}

// 解析 SKILL.md frontmatter
function parseSkillFrontmatter(content) {
  if (!content.startsWith('---')) return null
  const end = content.indexOf('---', 4)
  if (end === -1) return null

  const yaml = content.slice(4, end)
  const metadata = {}
  for (const line of yaml.split('\n')) {
    const [key, ...valueParts] = line.split(':')
    if (key && valueParts.length) {
      const value = valueParts.join(':').trim()
      if (value && !value.startsWith('|')) {
        metadata[key.trim()] = value
      }
    }
  }
  return metadata
}

// 扫描所有 skills
async function scanSkills(config) {
  const skills = []
  const excluded = config.excluded_skills || []

  for (const basePath of config.skill_paths) {
    if (!fs.existsSync(basePath)) continue

    const entries = fs.readdirSync(basePath, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const skillPath = path.join(basePath, entry.name)
      const skillMd = path.join(skillPath, 'SKILL.md')

      if (!fs.existsSync(skillMd)) continue

      let description = null
      try {
        const content = fs.readFileSync(skillMd, 'utf8')
        const meta = parseSkillFrontmatter(content)
        description = meta?.description || null
      } catch (e) {}

      let hasGit = fs.existsSync(path.join(skillPath, '.git'))
      let currentVersion = null
      let type = 'local'

      if (hasGit) {
        try {
          const git = gitP(skillPath)
          const remotes = await git.getRemotes(true)
          if (remotes.some(r => r.name === 'origin')) {
            type = 'remote'
          }
          const tags = await git.tags()
          const head = await git.revparse(['HEAD'])
          const tag = tags.all.find(t => t.startsWith('v') && tags.latest === t)
          currentVersion = tag || null
        } catch (e) {
          console.error('Git error:', e.message)
        }
      }

      if (excluded.includes(entry.name) || excluded.some(p => skillPath.includes(p))) {
        continue
      }

      const source = matchSource(skillPath, config) || null
      const remoteUrl = config.skill_remotes?.[entry.name] || null

      skills.push({
        name: entry.name,
        path: skillPath,
        type,
        description,
        has_git: hasGit,
        current_version: currentVersion,
        remote_url: remoteUrl,
        source: source
      })
    }
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name))
}

// API 路由
app.get('/api/config', (req, res) => {
  res.json(loadConfig())
})

app.post('/api/config', (req, res) => {
  saveConfig(req.body)
  res.json({ success: true })
})

app.post('/api/skills/exclude', (req, res) => {
  const { name } = req.body
  const config = loadConfig()
  if (!config.excluded_skills) {
    config.excluded_skills = []
  }
  if (!config.excluded_skills.includes(name)) {
    config.excluded_skills.push(name)
  }
  saveConfig(config)
  res.json({ success: true })
})

app.post('/api/skills/include', (req, res) => {
  const { name } = req.body
  const config = loadConfig()
  if (config.excluded_skills) {
    config.excluded_skills = config.excluded_skills.filter(n => n !== name)
  }
  saveConfig(config)
  res.json({ success: true })
})

app.get('/api/skills/excluded', (req, res) => {
  const config = loadConfig()
  res.json(config.excluded_skills || [])
})

app.post('/api/skills/set-remote', async (req, res) => {
  const { name, repoUrl } = req.body
  try {
    const config = loadConfig()
    if (!config.skill_remotes) {
      config.skill_remotes = {}
    }
    config.skill_remotes[name] = repoUrl
    saveConfig(config)

    const skills = await scanSkills(config)
    const skill = skills.find(s => s.name === name)
    if (skill && skill.has_git) {
      const git = gitP(skill.path)
      const remotes = await git.getRemotes()
      const hasOrigin = remotes.some(r => r.name === 'origin')
      if (hasOrigin) {
        await git.remote(['set-url', 'origin', repoUrl])
      } else {
        await git.remote(['add', 'origin', repoUrl])
      }
    }

    res.json({ success: true })
  } catch (e) {
    console.error('Set remote error:', e)
    res.status(500).json({ error: e.message || e.toString() })
  }
})

app.get('/api/skills/remote-info', async (req, res) => {
  const { name } = req.query
  const config = loadConfig()
  const repoUrl = config.skill_remotes?.[name] || null

  let status = null
  const skills = await scanSkills(config)
  const skill = skills.find(s => s.name === name)

  if (skill && skill.has_git) {
    try {
      const git = gitP(skill.path)
      await git.fetch('origin')
      const localHead = await git.revparse(['HEAD'])
      const remoteHead = await git.revparse(['origin/main'])
      const ahead = await git.raw(['rev-list', '--count', 'HEAD..origin/main'])
      status = {
        has_remote: true,
        behind_commits: parseInt(ahead) || 0,
        local_head: localHead.trim(),
        remote_head: remoteHead.trim()
      }
    } catch (e) {
      status = { has_remote: false, error: e.message }
    }
  }

  res.json({ repoUrl, status })
})

app.post('/api/skills/pull', async (req, res) => {
  const { name, strategy } = req.body
  try {
    const config = loadConfig()
    const skills = await scanSkills(config)
    const skill = skills.find(s => s.name === name)

    if (!skill || !skill.has_git) {
      return res.status(400).json({ error: 'Skill 不存在或未初始化 Git' })
    }

    const git = gitP(skill.path)

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    await git.branch([`backup-before-pull-${timestamp}`])

    await git.fetch('origin')

    if (strategy === 'merge') {
      await git.merge(['origin/main'])
    } else {
      await git.reset(['--hard', 'origin/main'])
    }

    res.json({ success: true, message: '更新成功' })
  } catch (e) {
    console.error('Pull error:', e)
    res.status(500).json({ error: e.message || e.toString() })
  }
})

app.get('/api/skills', async (req, res) => {
  try {
    const config = loadConfig()
    const skills = await scanSkills(config)
    res.json(skills)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/skills/init', async (req, res) => {
  const { path: skillPath } = req.body
  try {
    if (!fs.existsSync(skillPath)) {
      return res.status(400).json({ error: `路径不存在: ${skillPath}` })
    }

    const git = gitP(skillPath)
    await git.init()
    await git.add('.')
    await git.commit('feat: 初始化版本管理')
    await git.tag([`-a`, `v1.0.0`, `-m`, `Initial version`])
    res.json({ success: true, message: `初始化成功，创建版本 v1.0.0` })
  } catch (e) {
    console.error('Init error:', e)
    res.status(500).json({ error: e.message || e.toString() })
  }
})

app.post('/api/skills/commit', async (req, res) => {
  const { path: skillPath, message, versionType } = req.body
  try {
    if (!fs.existsSync(skillPath)) {
      return res.status(400).json({ error: `路径不存在: ${skillPath}` })
    }

    const git = gitP(skillPath)

    const tags = await git.tags()
    const currentVersion = tags.latest || 'v0.0.0'

    const parts = currentVersion.replace('v', '').split('.').map(Number)
    if (versionType === 'patch') parts[2]++
    else if (versionType === 'minor') { parts[1]++; parts[2] = 0 }
    else if (versionType === 'major') { parts[0]++; parts[1] = 0; parts[2] = 0 }
    const newVersion = `v${parts.join('.')}`

    await git.add('.')
    await git.commit(message)
    await git.tag([`-a`, newVersion, `-m`, message])

    res.json({ success: true, message: `提交成功，创建版本 ${newVersion}` })
  } catch (e) {
    console.error('Commit error:', e)
    res.status(500).json({ error: e.message || e.toString() })
  }
})

app.get('/api/skills/log', async (req, res) => {
  const { path: skillPath } = req.query
  try {
    const git = gitP(skillPath)
    const log = await git.log({ maxCount: 50 })
    const tags = await git.tags()

    const commits = log.all.map(commit => ({
      id: commit.hash,
      message: commit.message,
      author: commit.author_name,
      time: Math.floor(new Date(commit.date).getTime() / 1000),
      tags: tags.all.filter(t => commit.hash.startsWith(tags.all.find(x => x === t)?.split(' ')[0] || ''))
    }))

    res.json(commits)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/skills/revert', async (req, res) => {
  const { path: skillPath, tag } = req.body
  try {
    const git = gitP(skillPath)
    await git.checkout(tag)
    res.json({ success: true, message: `已回退到版本 ${tag}` })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/skills/install', async (req, res) => {
  const { repoUrl, targetPath } = req.body
  try {
    const git = gitP()
    await git.clone(repoUrl, targetPath)
    res.json({ success: true, message: '安装成功' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/skills/diff', async (req, res) => {
  const { path: skillPath } = req.query
  try {
    const git = gitP(skillPath)
    await git.fetch('origin')
    const diff = await git.diff(['HEAD', 'origin/main'])
    res.send(diff || '无差异')
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/skills/diff-commits', async (req, res) => {
  const { path: skillPath, from, to } = req.query
  try {
    const git = gitP(skillPath)
    const toRef = to || 'HEAD'
    const diff = await git.diff([from, toRef])
    res.send(diff || '无差异')
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const PORT = 3737
app.listen(PORT, () => {
  console.log(`MySkills server started on port ${PORT}`)
})
