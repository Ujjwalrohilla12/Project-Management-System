import { prisma } from "../configs/prisma.js";

export const getUserWorkspaces = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: { some: { userId: userId } },
      },
      include: {
        members: { include: { user: true } },
        projects: {
          include: {
            tasks: { include: { assignee: true, comments: { include: { user: true } } } },
            members: { include: { user: true } }
          }
        },
        owner: true
      },
    });
    res.json(workspaces)
  } catch (error) {
    console.log(error);
    res.status(500).json({message: error.code || error.message})
  }
}

export const createWorkspace = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { name, slug, image_url } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: "Name and slug are required" });
    }

    const workspace = await prisma.workspace.create({
      data: {
        id: slug,
        name,
        slug,
        ownerId: userId,
        image_url,
      }
    });

    // Add creator as ADMIN member
    await prisma.workspaceMember.create({
      data: {
        userId,
        workspaceId: workspace.id,
        role: 'ADMIN'
      }
    });

    res.json({ workspace, message: "Workspace created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};

export const updateWorkspace = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { id } = req.params;
    const { name, image_url } = req.body;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: { members: true }
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (workspace.ownerId !== userId) {
      return res.status(403).json({ message: "Only owner can update workspace" });
    }

    const updated = await prisma.workspace.update({
      where: { id },
      data: { name, image_url }
    });

    res.json({ workspace: updated, message: "Workspace updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.code || error.message });
  }
};
