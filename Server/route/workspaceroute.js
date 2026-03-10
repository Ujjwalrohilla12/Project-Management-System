import express from "express";
import {addMember, getUserWorkspaces} from "../controller/workspaceController.js"

const workspaceRouter = express.Router();

workspaceRouter.get('/',getUserWorkspaces);
workspaceRouter.post('/add-member',getUserWorkspaces);

export default workspaceRouter;