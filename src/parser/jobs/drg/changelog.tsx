import CONTRIBUTORS from 'data/CONTRIBUTORS'
import React from 'react'

export const changelog = [
	{
		date: new Date('2024-07-09'),
		Changes: () => <>DRG marked as supported for Patch 7.0.</>,
		contributors: [CONTRIBUTORS.FALINDRITH],
	},
	{
		date: new Date('2024-06-28'),
		Changes: () => <>Initial DRG support for Dawntrail.</>,
		contributors: [CONTRIBUTORS.FALINDRITH],
	},
]